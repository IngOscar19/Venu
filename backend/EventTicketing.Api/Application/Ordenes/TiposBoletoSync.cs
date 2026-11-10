using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Ordenes;

/// <summary>
/// El organizador configura "secciones" del evento (EventSection). La compra usa "tipos de boleto"
/// (TipoBoleto) para llevar el inventario. Este helper garantiza que exista un TipoBoleto por cada
/// sección, con el mismo Id, para que el catálogo y las órdenes usen identificadores consistentes.
/// </summary>
public static class TiposBoletoSync
{
    public static async Task EnsureAsync(AppDbContext db, Guid eventId, CancellationToken ct = default)
    {
        var secciones = await db.EventSections.Where(s => s.EventId == eventId).ToListAsync(ct);
        if (secciones.Count == 0) return;

        var ids = secciones.Select(s => s.Id).ToList();
        var existentes = await db.TiposBoleto.Where(t => t.EventoId == eventId).ToListAsync(ct);
        var porId = existentes.ToDictionary(t => t.Id);
        var cambios = false;

        foreach (var s in secciones)
        {
            if (porId.TryGetValue(s.Id, out var tipo))
            {
                if (tipo.Nombre != s.Name || tipo.Precio != s.BasePrice || tipo.CantidadDisponible != s.Capacity)
                {
                    tipo.Nombre = s.Name;
                    tipo.Precio = s.BasePrice;
                    tipo.CantidadDisponible = s.Capacity;
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
                    CantidadVendida = 0
                });
                cambios = true;
            }
        }

        if (cambios) await db.SaveChangesAsync(ct);
    }
}
