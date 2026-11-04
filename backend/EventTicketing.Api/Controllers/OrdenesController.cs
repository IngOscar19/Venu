using System.Security.Claims;
using EventTicketing.Api.Application.Ordenes;
using EventTicketing.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("ordenes")]
[Route("api/ordenes")]
[Authorize]
public class OrdenesController : ControllerBase
{
    private readonly CrearOrdenCommand _crearOrden;
    private readonly AppDbContext _db;

    public OrdenesController(CrearOrdenCommand crearOrden, AppDbContext db)
    {
        _crearOrden = crearOrden;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] List<ItemOrdenRequest> items)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var usuarioId))
        {
            return Unauthorized("Usuario no autenticado o token inválido.");
        }

        var resultado = await _crearOrden.EjecutarAsync(usuarioId, items);

        if (!resultado.Exito)
            return Conflict(new { mensaje = "Ya no hay disponibilidad suficiente", tipoBoletoId = resultado.TipoBoletoSinDisponibilidad });

        return Ok(new { ordenId = resultado.OrdenId });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Consultar(Guid id)
    {
        var orden = await _db.Ordenes
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (orden is null) return NotFound();
        return Ok(new { orden.Id, Estado = orden.Estado.ToString(), orden.Total, orden.Fecha });
    }

    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var orden = await _db.Ordenes.Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (orden is null) return NotFound();
        if (orden.Estado != EstadoOrden.Pendiente) return BadRequest("Solo se pueden cancelar órdenes pendientes.");

        foreach (var detalle in orden.Detalles)
        {
            if (detalle.TipoBoleto != null)
            {
                detalle.TipoBoleto.CantidadVendida -= detalle.Cantidad; // libera inventario
            }
        }

        orden.Estado = EstadoOrden.Cancelada;
        await _db.SaveChangesAsync();
        return Ok(new { mensaje = "Orden cancelada exitosamente", ordenId = orden.Id });
    }
}
