using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Ordenes;

/// <summary>
/// El organizador configura "secciones" del evento (EventSection). La compra usa "tipos de boleto"
/// (TipoBoleto) para llevar el inventario. Este helper garantiza que exista un TipoBoleto por cada
/// sección, con el mismo Id, y sincroniza las cantidades vendidas contra los boletos reales en BD.
/// </summary>
public static class TiposBoletoSync
{
    public static async Task EnsureAsync(AppDbContext db, Guid eventId, CancellationToken ct = default)
    {
        var secciones = await db.EventSections.Where(s => s.EventId == eventId).ToListAsync(ct);
        if (secciones.Count == 0) return;

        var existentes = await db.TiposBoleto.Where(t => t.EventoId == eventId).ToListAsync(ct);
        var porId = existentes.ToDictionary(t => t.Id);

        // Boletos confirmados y activos en Tickets
        var boletosVendidos = await db.Tickets
            .Where(t => t.Order.EventId == eventId && t.Status != TicketStatus.CANCELLED)
            .GroupBy(t => t.EventSectionId)
            .Select(g => new { SectionId = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.SectionId, x => x.Cantidad, ct);

        // Boletos en órdenes pendientes dentro de los 15 minutos de reserva
        var limiteVigencia = DateTime.UtcNow.AddMinutes(-15);
        var boletosApartados = await db.OrdenDetalles
            .Include(d => d.Orden)
            .Where(d => d.Orden.EventId == eventId && d.Orden.Estado == EstadoOrden.Pendiente && d.Orden.Fecha >= limiteVigencia)
            .GroupBy(d => d.TipoBoletoId)
            .Select(g => new { TipoBoletoId = g.Key, Cantidad = g.Sum(x => x.Cantidad) })
            .ToDictionaryAsync(x => x.TipoBoletoId, x => x.Cantidad, ct);

        var cambios = false;

        foreach (var s in secciones)
        {
            var vendidos = boletosVendidos.GetValueOrDefault(s.Id, 0);
            var apartados = boletosApartados.GetValueOrDefault(s.Id, 0);
            var totalOcupados = vendidos + apartados;

            if (porId.TryGetValue(s.Id, out var tipo))
            {
                if (tipo.Nombre != s.Name || tipo.Precio != s.BasePrice || tipo.CantidadDisponible != s.Capacity || tipo.CantidadVendida != totalOcupados)
                {
                    tipo.Nombre = s.Name;
                    tipo.Precio = s.BasePrice;
                    tipo.CantidadDisponible = s.Capacity;
                    tipo.CantidadVendida = totalOcupados;
                    cambios = true;
                }
            }
            else if (!existentes.Any(t => t.Nombre == s.Name))
            {
                db.TiposBoleto.Add(new TipoBoleto
                {
                    Id = s.Id,
                    EventoId = eventId,
                    Nombre = s.Name,
                    Precio = s.BasePrice,
                    CantidadDisponible = s.Capacity,
                    CantidadVendida = totalOcupados
                });
                cambios = true;
            }
        }

        if (cambios) await db.SaveChangesAsync(ct);
    }
}
