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
