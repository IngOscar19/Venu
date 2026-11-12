using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Ordenes;

public class CrearOrdenCommand
{
    public const int MaxBoletosPorUsuarioYEvento = 4; // Límite acumulativo anti-reventa por persona y evento
    public const int MaxBoletosPorTipo = 4;
    public const int MaxBoletosPorOrden = 4;
    private readonly AppDbContext _db;

    public CrearOrdenCommand(AppDbContext db) => _db = db;

    public async Task<ResultadoCrearOrden> EjecutarAsync(Guid usuarioId, List<ItemOrdenRequest> items)
    {
        if (items is null || items.Count == 0)
            return ResultadoCrearOrden.Invalido("Debes seleccionar al menos un boleto.");

        // Se consolidan duplicados y se valida cantidad
        var consolidados = items
            .GroupBy(i => i.TipoBoletoId)
            .Select(g => new ItemOrdenRequest(g.Key, g.Sum(x => x.Cantidad)))
            .ToList();

        if (consolidados.Any(i => i.Cantidad <= 0 || i.Cantidad > MaxBoletosPorTipo))
            return ResultadoCrearOrden.Invalido($"Para evitar la reventa, la cantidad por tipo de boleto debe ser entre 1 y {MaxBoletosPorTipo}.");
        if (consolidados.Sum(i => i.Cantidad) > MaxBoletosPorOrden)
            return ResultadoCrearOrden.Invalido($"Para evitar la reventa, el límite es de máximo {MaxBoletosPorOrden} boletos por orden.");

        // Los tipos de boleto deben existir y pertenecer a un único evento vigente
        var primerId = consolidados[0].TipoBoletoId;
        var seccion = await _db.EventSections.AsNoTracking().FirstOrDefaultAsync(s => s.Id == primerId);
        var eventoId = seccion?.EventId
            ?? (await _db.TiposBoleto.AsNoTracking().Where(t => t.Id == primerId).Select(t => (Guid?)t.EventoId).FirstOrDefaultAsync());
        if (eventoId is null)
            return ResultadoCrearOrden.Invalido("El tipo de boleto seleccionado no existe.");

        var evento = await _db.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventoId.Value);
        if (evento is null)
            return ResultadoCrearOrden.Invalido("El evento no existe.");
        if (evento.Status != EventStatus.PUBLISHED && evento.Status != EventStatus.RESCHEDULED)
            return ResultadoCrearOrden.Invalido("El evento no está disponible para la venta de boletos.");
        if (EventSchedule.HasEnded(evento))
            return ResultadoCrearOrden.Invalido("Este evento ya finalizó y no admite compras.");

        // ── Límite acumulativo anti-reventa por usuario y evento ──────────────────
        var boletosConfirmados = await _db.Tickets
            .Include(t => t.Order)
            .Where(t => t.Order.UsuarioId == usuarioId && t.Order.EventId == evento.Id && t.Status != TicketStatus.CANCELLED)
            .CountAsync();

        // Considerar órdenes pendientes no expiradas (dentro de los 15 minutos de reserva)
        var vigenciaMinima = DateTime.UtcNow.AddMinutes(-15);
        var boletosEnProceso = await _db.OrdenDetalles
            .Include(d => d.Orden)
            .Where(d => d.Orden.UsuarioId == usuarioId && d.Orden.EventId == evento.Id && d.Orden.Estado == EstadoOrden.Pendiente && d.Orden.Fecha >= vigenciaMinima)
            .SumAsync(d => d.Cantidad);

        var cantidadSolicitada = consolidados.Sum(x => x.Cantidad);
        if (boletosConfirmados + boletosEnProceso + cantidadSolicitada > MaxBoletosPorUsuarioYEvento)
        {
            var disponiblesParaUsuario = Math.Max(0, MaxBoletosPorUsuarioYEvento - (boletosConfirmados + boletosEnProceso));
            var mensaje = disponiblesParaUsuario > 0
                ? $"Para evitar la reventa, el límite acumulativo por persona es de {MaxBoletosPorUsuarioYEvento} boletos. Ya cuentas con {boletosConfirmados + boletosEnProceso} boletos asociados a este evento; solo puedes adquirir {disponiblesParaUsuario} más."
                : $"Has alcanzado el límite máximo de {MaxBoletosPorUsuarioYEvento} boletos permitidos por persona para este evento.";

            return ResultadoCrearOrden.Invalido(mensaje);
        }

        await TiposBoletoSync.EnsureAsync(_db, evento.Id);

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var orden = new Orden { UsuarioId = usuarioId, EventId = evento.Id };
        decimal total = 0;

        foreach (var item in consolidados)
        {
            var tipoBoleto = await _db.TiposBoleto.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == item.TipoBoletoId && t.EventoId == evento.Id);
            if (tipoBoleto is null)
            {
                await transaction.RollbackAsync();
                return ResultadoCrearOrden.Invalido("Todos los boletos deben pertenecer al mismo evento.");
            }

            // UPDATE condicional atómico: solo descuenta si de verdad hay disponibilidad.
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

            var detalle = new OrdenDetalle
            {
                TipoBoletoId = item.TipoBoletoId,
                Cantidad = item.Cantidad,
                PrecioUnitario = tipoBoleto.Precio
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
    public string? Error { get; private init; }

    public static ResultadoCrearOrden Exitoso(Guid ordenId) => new() { Exito = true, OrdenId = ordenId };
    public static ResultadoCrearOrden SinDisponibilidad(Guid tipoBoletoId) =>
        new() { Exito = false, TipoBoletoSinDisponibilidad = tipoBoletoId };
    public static ResultadoCrearOrden Invalido(string error) => new() { Exito = false, Error = error };
}
