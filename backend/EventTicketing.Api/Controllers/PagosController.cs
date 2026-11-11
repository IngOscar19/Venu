using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("pagos")]
[Route("api/pagos")]
public class PagosController : ControllerBase
{
    private readonly IProcesadorPago _procesadorPago;
    private readonly ConfirmarPagoCommand _confirmarPago;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PagosController> _logger;

    public PagosController(
        IProcesadorPago procesadorPago,
        ConfirmarPagoCommand confirmarPago,
        AppDbContext db,
        IConfiguration config,
        ILogger<PagosController> logger)
    {
        _procesadorPago = procesadorPago;
        _confirmarPago = confirmarPago;
        _db = db;
        _config = config;
        _logger = logger;
    }

    [HttpPost("preferencia")]
    [Authorize]
    public async Task<IActionResult> CrearPreferencia([FromBody] CrearPreferenciaRequest req)
    {
        var usuarioId = User.GetUserId();
        if (usuarioId is null) return Unauthorized();

        var orden = await _db.Ordenes
            .Include(o => o.User)
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .FirstOrDefaultAsync(o => o.Id == req.OrdenId);

        // Solo el dueño de la orden puede iniciar su pago
        if (orden is null || orden.UsuarioId != usuarioId.Value) return NotFound();
        if (orden.Estado != EstadoOrden.Pendiente) return BadRequest("La orden ya no está pendiente de pago.");

        var checkoutUrl = await _procesadorPago.CrearPreferenciaAsync(orden);
        return Ok(new { checkoutUrl });
    }

    /// <summary>
    /// Confirmación directa iniciada por el cliente con el payment_id que devuelve Mercado Pago al redirigir.
    /// Resuelve el caso en que el webhook tarda o no llega: el backend consulta directo a Mercado Pago y acredita.
    /// </summary>
    [HttpPost("confirmar")]
    [Authorize]
    public async Task<IActionResult> Confirmar([FromBody] ConfirmarPagoRequest req)
    {
        var usuarioId = User.GetUserId();
        if (usuarioId is null) return Unauthorized();

        var orden = await _db.Ordenes.AsNoTracking().FirstOrDefaultAsync(o => o.Id == req.OrdenId);
        if (orden is null || (orden.UsuarioId != usuarioId.Value && !User.IsAdminUser()))
            return NotFound();

        if (orden.Estado == EstadoOrden.Pagada)
            return Ok(new { estado = "approved", mensaje = "La orden ya está pagada." });

        try
        {
            ResultadoPago? resultado = null;

            if (!string.IsNullOrWhiteSpace(req.PaymentId))
            {
                resultado = await _procesadorPago.ConsultarPagoAsync(req.PaymentId);
            }
            else
            {
                resultado = await BuscarPagoPorOrdenAsync(req.OrdenId);
            }

            if (resultado is null)
            {
                return Ok(new { estado = "pending", mensaje = "Aún no se registra el pago en Mercado Pago." });
            }

            if (resultado.OrdenId != req.OrdenId.ToString())
            {
                _logger.LogWarning("Pago {PaymentId} tiene ordenId {Ref} pero se esperaba {OrdenId}",
                    resultado.IdPagoExterno, resultado.OrdenId, req.OrdenId);
                return BadRequest(new { mensaje = "El pago no corresponde a esta orden." });
            }

            await _confirmarPago.EjecutarAsync(resultado);
            return Ok(new { estado = resultado.Estado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al confirmar pago {PaymentId} para orden {OrdenId}", req.PaymentId, req.OrdenId);
            return StatusCode(500, new { mensaje = "Error al consultar el pago con Mercado Pago." });
        }
    }

    private async Task<ResultadoPago?> BuscarPagoPorOrdenAsync(Guid ordenId)
    {
        var token = _config["MercadoPago:AccessToken"]
            ?? Environment.GetEnvironmentVariable("MERCADOPAGO_ACCESS_TOKEN")
            ?? Environment.GetEnvironmentVariable("MercadoPago__AccessToken");

        if (string.IsNullOrWhiteSpace(token)) return null;

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var url = $"https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference={ordenId}&limit=1";

            var resp = await client.GetAsync(url);
            if (!resp.IsSuccessStatusCode) return null;

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
            {
                var p = results[0];
                var id = p.GetProperty("id").GetInt64().ToString();
                var status = p.GetProperty("status").GetString() ?? "pending";
                var extRef = p.TryGetProperty("external_reference", out var er) ? er.GetString() : ordenId.ToString();
                var monto = p.TryGetProperty("transaction_amount", out var ta) ? ta.GetDecimal() : (decimal?)null;
                var metodo = p.TryGetProperty("payment_method_id", out var pm) ? pm.GetString() : null;

                return new ResultadoPago(status, extRef ?? ordenId.ToString(), id, monto, metodo);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error buscando pagos en Mercado Pago para orden {OrdenId}", ordenId);
        }

        return null;
    }

    /// <summary>
    /// Mercado Pago notifica en dos formatos: IPN (?topic=payment&amp;id=) y Webhooks (?type=payment&amp;data.id= con body JSON).
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous] // Mercado Pago llama este endpoint, no trae tu JWT
    public async Task<IActionResult> Webhook()
    {
        var tipo = Request.Query["type"].FirstOrDefault() ?? Request.Query["topic"].FirstOrDefault();
        var id = Request.Query["data.id"].FirstOrDefault() ?? Request.Query["id"].FirstOrDefault();

        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(tipo))
        {
            try
            {
                using var doc = await JsonDocument.ParseAsync(Request.Body);
                var root = doc.RootElement;
                tipo ??= root.TryGetProperty("type", out var t) ? t.GetString() : null;
                if (string.IsNullOrEmpty(id) && root.TryGetProperty("data", out var data) && data.TryGetProperty("id", out var did))
                    id = did.ValueKind == JsonValueKind.Number ? did.GetInt64().ToString() : did.GetString();
            }
            catch (JsonException) { /* sin body válido */ }
        }

        if (tipo != "payment" || string.IsNullOrEmpty(id) || !long.TryParse(id, out _))
            return Ok();

        if (!FirmaValida(id))
        {
            _logger.LogWarning("Webhook de Mercado Pago con firma inválida (pago {Id}).", id);
            return Unauthorized();
        }

        try
        {
            // El estado y el monto siempre se consultan directo a Mercado Pago, nunca se confían del request
            var resultado = await _procesadorPago.ConsultarPagoAsync(id);
            await _confirmarPago.EjecutarAsync(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook de pago {Id}", id);
            return StatusCode(500); // MP reintentará
        }

        return Ok();
    }

    // ───────── Checkout SIMULADO (solo si Pagos:Simulado=true) ─────────

    private bool SimulacionActiva => _config.GetValue<bool>("Pagos:Simulado");

    [HttpGet("simulado/{ordenId:guid}/checkout")]
    [AllowAnonymous] // lo abre el WebView, que no lleva JWT
    public async Task<IActionResult> CheckoutSimulado(Guid ordenId)
    {
        if (!SimulacionActiva) return NotFound();

        var orden = await _db.Ordenes.AsNoTracking().FirstOrDefaultAsync(o => o.Id == ordenId);
        if (orden is null || orden.Estado != EstadoOrden.Pendiente)
            return Content(PaginaSimulada("Orden no disponible", "Esta orden ya no está pendiente de pago.", null), "text/html; charset=utf-8");

        var html = PaginaSimulada(
            "Pago de prueba",
            $"Total a pagar: <b>${orden.Total:0.00} MXN</b><br/>Entorno de pruebas: no se realiza ningún cobro real.",
            ordenId);
        return Content(html, "text/html; charset=utf-8");
    }

    [HttpGet("simulado/{ordenId:guid}/resultado")]
    [AllowAnonymous]
    public async Task<IActionResult> ResultadoSimulado(Guid ordenId, [FromQuery] string status)
    {
        if (!SimulacionActiva) return NotFound();

        var aprobado = status == "approved";
        var orden = await _db.Ordenes.AsNoTracking().FirstOrDefaultAsync(o => o.Id == ordenId);
        if (orden is null) return NotFound();

        await _confirmarPago.EjecutarAsync(new ResultadoPago(
            aprobado ? "approved" : "rejected",
            ordenId.ToString(),
            $"SIM-{ordenId}",
            orden.Total,
            "simulado"));

        return Redirect($"miapp://pago-resultado?status={(aprobado ? "approved" : "rejected")}");
    }

    private static string PaginaSimulada(string titulo, string detalle, Guid? ordenId)
    {
        var botones = ordenId is null ? "" : $@"
            <a class='btn ok' href='/api/pagos/simulado/{ordenId}/resultado?status=approved'>Pagar (simulado)</a>
            <a class='btn no' href='/api/pagos/simulado/{ordenId}/resultado?status=rejected'>Rechazar pago</a>";
        return $@"<!doctype html><html lang='es'><head><meta charset='utf-8'>
<meta name='viewport' content='width=device-width, initial-scale=1'>
<style>
body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:24px;background:#f5f5f5;color:#222}}
.card{{background:#fff;border-radius:12px;padding:24px;max-width:420px;margin:40px auto;box-shadow:0 2px 8px #0002;text-align:center}}
.tag{{display:inline-block;background:#fde68a;color:#92400e;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:700}}
.btn{{display:block;margin-top:14px;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;color:#fff}}
.ok{{background:#16a34a}}.no{{background:#6b7280}}
</style></head><body><div class='card'>
<span class='tag'>MODO PRUEBA</span><h2>{titulo}</h2><p>{detalle}</p>{botones}
</div></body></html>";
    }

    /// <summary>Valida x-signature (HMAC-SHA256) cuando MercadoPago:WebhookSecret está configurado.</summary>
    private bool FirmaValida(string dataId)
    {
        var secret = _config["MercadoPago:WebhookSecret"] ?? Environment.GetEnvironmentVariable("MERCADOPAGO_WEBHOOK_SECRET");
        if (string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogWarning("MercadoPago:WebhookSecret no configurado: no se valida la firma del webhook.");
            return true;
        }

        var firma = Request.Headers["x-signature"].FirstOrDefault();
        var requestId = Request.Headers["x-request-id"].FirstOrDefault() ?? string.Empty;
        if (string.IsNullOrEmpty(firma)) return false;

        string? ts = null, v1 = null;
        foreach (var parte in firma.Split(','))
        {
            var kv = parte.Split('=', 2);
            if (kv.Length != 2) continue;
            if (kv[0].Trim() == "ts") ts = kv[1].Trim();
            else if (kv[0].Trim() == "v1") v1 = kv[1].Trim();
        }
        if (ts is null || v1 is null) return false;

        var manifiesto = $"id:{dataId.ToLowerInvariant()};request-id:{requestId};ts:{ts};";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var calculada = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(manifiesto))).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(calculada), Encoding.UTF8.GetBytes(v1.ToLowerInvariant()));
    }
}

public record CrearPreferenciaRequest(Guid OrdenId);
public record ConfirmarPagoRequest(Guid OrdenId, string? PaymentId = null);
