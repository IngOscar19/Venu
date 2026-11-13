using EventTicketing.Api.Application.Ordenes;
using System.Security.Claims;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("eventos")]
[Route("api/eventos")]
public class EventosController : ControllerBase
{
    private readonly AppDbContext _db;

    public EventosController(AppDbContext db) => _db = db;

    [HttpGet("{id}/tipos-boleto")]
    [AllowAnonymous] // cualquiera puede ver precios y disponibilidad antes de loguearse
    public async Task<IActionResult> TiposBoleto(Guid id)
    {
        var evento = await _db.Events.FindAsync(id);
        if (evento is null) return NotFound();

        await TiposBoletoSync.EnsureAsync(_db, id);

        var tipos = await _db.TiposBoleto
            .Where(t => t.EventoId == id)
            .Select(t => new
            {
                t.Id,
                t.Nombre,
                t.Precio,
                CantidadDisponible = t.CantidadDisponible,
                CantidadVendida = t.CantidadVendida,
                Disponibles = Math.Max(0, t.CantidadDisponible - t.CantidadVendida)
            })
            .ToListAsync();

        // Si no hay registros en TiposBoleto pero hay secciones configuradas, devolvemos las secciones
        if (tipos.Count == 0)
        {
            var secciones = await _db.EventSections
                .Where(s => s.EventId == id)
                .Select(s => new
                {
                    s.Id,
                    Nombre = s.Name,
                    Precio = s.BasePrice,
                    Disponibles = s.Capacity
                })
                .ToListAsync();

            return Ok(secciones);
        }

        return Ok(tipos);
    }

    [HttpGet("{id}/ventas")]
    [Authorize] // Ajustado: valida admin y organizador incluso si el claim de rol no viene en el token
    public async Task<IActionResult> Ventas(Guid id)
    {
        var evento = await _db.Events.FindAsync(id);
        if (evento is null) return NotFound();

        var esAdmin = User.IsInRole("ADMIN")
            || User.IsInRole("Admin")
            || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "ADMIN", StringComparison.OrdinalIgnoreCase)
            || string.Equals(User.FindFirst("role")?.Value, "ADMIN", StringComparison.OrdinalIgnoreCase);

        // Si el JWT no incluye el claim de rol, verificamos directamente en la base de datos
        if (!esAdmin)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var usuarioId))
            {
                var usuario = await _db.Users.Include(u => u.Organizer).FirstOrDefaultAsync(u => u.Id == usuarioId);
                if (usuario != null)
                {
                    if (string.Equals(usuario.Role, "ADMIN", StringComparison.OrdinalIgnoreCase)
                        || (usuario.Organizer != null && usuario.Organizer.Id == evento.OrganizerId))
                    {
                        esAdmin = true;
                    }
                }
            }
        }

        if (!esAdmin)
        {
            return Forbid();
        }

        var porTipo = await _db.TiposBoleto
            .Where(t => t.EventoId == id)
            .Select(t => new
            {
                t.Id,
                t.Nombre,
                t.CantidadDisponible,
                t.CantidadVendida,
                Ingresos = t.CantidadVendida * t.Precio
            })
            .ToListAsync();

        if (porTipo.Count == 0)
        {
            var secciones = await _db.EventSections
                .Where(s => s.EventId == id)
                .ToListAsync();

            var tickets = await _db.Tickets
                .Where(t => t.Order.EventId == id && t.Status != TicketStatus.CANCELLED)
                .ToListAsync();

            var porTipoFallback = secciones.Select(s =>
            {
                var vendidos = tickets.Count(t => t.EventSectionId == s.Id);
                return new
                {
                    s.Id,
                    Nombre = s.Name,
                    CantidadDisponible = s.Capacity,
                    CantidadVendida = vendidos,
                    Ingresos = vendidos * s.BasePrice
                };
            }).ToList();

            return Ok(new
            {
                EventoId = id,
                TotalBoletosVendidos = porTipoFallback.Sum(t => t.CantidadVendida),
                TotalIngresos = porTipoFallback.Sum(t => t.Ingresos),
                PorTipo = porTipoFallback
            });
        }

        return Ok(new
        {
            EventoId = id,
            TotalBoletosVendidos = porTipo.Sum(t => t.CantidadVendida),
            TotalIngresos = porTipo.Sum(t => t.Ingresos),
            PorTipo = porTipo
        });
    }
}
