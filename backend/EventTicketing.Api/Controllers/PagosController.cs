using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Domain.Entities;
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

    public PagosController(IProcesadorPago procesadorPago, ConfirmarPagoCommand confirmarPago, AppDbContext db)
    {
        _procesadorPago = procesadorPago;
        _confirmarPago = confirmarPago;
        _db = db;
    }

    [HttpPost("preferencia")]
    [Authorize]
    public async Task<IActionResult> CrearPreferencia([FromBody] CrearPreferenciaRequest req)
    {
        var orden = await _db.Ordenes
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .FirstOrDefaultAsync(o => o.Id == req.OrdenId);

        if (orden is null) return NotFound();
        if (orden.Estado != EstadoOrden.Pendiente) return BadRequest("La orden ya no está pendiente de pago.");

        var checkoutUrl = await _procesadorPago.CrearPreferenciaAsync(orden);
        return Ok(new { checkoutUrl });
    }

    [HttpPost("webhook")]
    [AllowAnonymous] // Mercado Pago llama este endpoint, no trae tu JWT
    public async Task<IActionResult> Webhook([FromQuery] string topic, [FromQuery] string id)
    {
        if (topic == "payment")
        {
            var resultado = await _procesadorPago.ConsultarPagoAsync(id);
            await _confirmarPago.EjecutarAsync(resultado);
        }
        return Ok(); // siempre 200, o Mercado Pago reintenta indefinidamente
    }
}

public record CrearPreferenciaRequest(Guid OrdenId);
