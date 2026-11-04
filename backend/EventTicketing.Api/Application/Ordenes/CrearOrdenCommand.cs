using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Ordenes;

public class CrearOrdenCommand
{
    private readonly AppDbContext _db;

    public CrearOrdenCommand(AppDbContext db) => _db = db;

    public async Task<ResultadoCrearOrden> EjecutarAsync(Guid usuarioId, List<ItemOrdenRequest> items)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var orden = new Orden { UsuarioId = usuarioId };
        decimal total = 0;

        foreach (var item in items)
        {
            // UPDATE condicional: solo descuenta si de verdad hay disponibilidad.
            // Si RowsAffected da 0, ya no había boletos -> se rechaza toda la orden.
            var filasAfectadas = await _db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE ""TiposBoleto""
                SET ""CantidadVendida"" = ""CantidadVendida"" + {item.Cantidad}
                WHERE ""Id"" = {item.TipoBoletoId}
                  AND ""CantidadVendida"" + {item.Cantidad} <= ""CantidadDisponible""");

            if (filasAfectadas == 0)
            {
                await transaction.RollbackAsync();
                return ResultadoCrearOrden.SinDisponibilidad(item.TipoBoletoId);
            }

            var tipoBoleto = await _db.TiposBoleto.FindAsync(item.TipoBoletoId);
            if (orden.EventId == Guid.Empty && tipoBoleto != null)
            {
                orden.EventId = tipoBoleto.EventoId;
            }

            var detalle = new OrdenDetalle
            {
                TipoBoletoId = item.TipoBoletoId,
                Cantidad = item.Cantidad,
                PrecioUnitario = tipoBoleto!.Precio
            };

            orden.Detalles.Add(detalle);
            total += detalle.PrecioUnitario * detalle.Cantidad;
        }

        orden.Total = total;
        _db.Ordenes.Add(orden);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return ResultadoCrearOrden.Exitoso(orden.Id);
    }
}

public record ItemOrdenRequest(Guid TipoBoletoId, int Cantidad);

public class ResultadoCrearOrden
{
    public bool Exito { get; private init; }
    public Guid? OrdenId { get; private init; }
    public Guid? TipoBoletoSinDisponibilidad { get; private init; }

    public static ResultadoCrearOrden Exitoso(Guid ordenId) => new() { Exito = true, OrdenId = ordenId };
    public static ResultadoCrearOrden SinDisponibilidad(Guid tipoBoletoId) =>
        new() { Exito = false, TipoBoletoSinDisponibilidad = tipoBoletoId };
}
