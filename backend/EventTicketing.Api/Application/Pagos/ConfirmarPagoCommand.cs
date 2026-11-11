using EventTicketing.Api.Application.Boletos;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Pagos;

public class ConfirmarPagoCommand
{
    private readonly AppDbContext _db;
    private readonly GenerarBoletosService _generarBoletos;
    private readonly IProcesadorPago _procesador;
    private readonly ILogger<ConfirmarPagoCommand> _logger;

    public ConfirmarPagoCommand(
        AppDbContext db,
        GenerarBoletosService generarBoletos,
        IProcesadorPago procesador,
        ILogger<ConfirmarPagoCommand> logger)
    {
        _db = db;
        _generarBoletos = generarBoletos;
        _procesador = procesador;
        _logger = logger;
    }

    public async Task EjecutarAsync(ResultadoPago resultado)
    {
        if (!Guid.TryParse(resultado.OrdenId, out var ordenId))
        {
            _logger.LogWarning("Pago {PagoId} con external_reference inválida: {Ref}", resultado.IdPagoExterno, resultado.OrdenId);
            return;
        }

        var orden = await _db.Ordenes
            .Include(o => o.User)
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .Include(o => o.Pago)
            .FirstOrDefaultAsync(o => o.Id == ordenId);

        if (orden is null) return;

        // Idempotencia: este pago ya fue registrado
        if (orden.Pago is not null && orden.Pago.ReferenciaExterna == resultado.IdPagoExterno)
        {
            if (orden.Estado != EstadoOrden.Pagada || orden.Tickets.Count == 0)
            {
                orden.Estado = EstadoOrden.Pagada;
                await _generarBoletos.GenerarDesdeOrdenAsync(orden);
                await _db.SaveChangesAsync();
            }
            return;
        }

        var aprobado = resultado.Estado == "approved";

        if (aprobado && orden.Estado == EstadoOrden.Pendiente)
        {
            // El monto cobrado debe coincidir aproximadamente con el total de la orden (tolerancia por comisiones/redondeo)
            if (resultado.Monto is not null && Math.Abs(resultado.Monto.Value - orden.Total) > 1.0m)
            {
                _logger.LogError("Monto inconsistente en pago {PagoId}: cobrado {Monto}, esperado {Total}. Orden {OrdenId} NO confirmada.",
                    resultado.IdPagoExterno, resultado.Monto, orden.Total, orden.Id);
                return;
            }

            orden.Estado = EstadoOrden.Pagada;
            orden.UpdatedAt = DateTime.UtcNow;
            orden.Pago = new Pago
            {
                OrdenId = orden.Id,
                Monto = orden.Total,
                MetodoPago = resultado.MetodoPago ?? "mercadopago",
                Estado = resultado.Estado,
                ReferenciaExterna = resultado.IdPagoExterno
            };
            await _generarBoletos.GenerarDesdeOrdenAsync(orden);
        }
        else if (aprobado && orden.Pago is null && orden.Estado is EstadoOrden.Expirada or EstadoOrden.Cancelada)
        {
            // Pago aprobado tardío: el inventario ya se liberó, se devuelve el dinero al cliente
            _logger.LogWarning("Pago {PagoId} aprobado para orden {OrdenId} en estado {Estado}. Reembolsando.",
                resultado.IdPagoExterno, orden.Id, orden.Estado);

            var estadoReembolso = "reembolso_pendiente";
            try
            {
                await _procesador.ReembolsarAsync(resultado.IdPagoExterno);
                estadoReembolso = "reembolsado";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo reembolsar automáticamente el pago {PagoId}. Requiere atención manual.", resultado.IdPagoExterno);
            }

            orden.Pago = new Pago
            {
                OrdenId = orden.Id,
                Monto = resultado.Monto ?? orden.Total,
                MetodoPago = resultado.MetodoPago ?? "mercadopago",
                Estado = estadoReembolso,
                ReferenciaExterna = resultado.IdPagoExterno
            };
        }
        else if (orden.Estado == EstadoOrden.Pendiente && resultado.Estado is "rejected" or "cancelled")
        {
            // Libera el inventario reservado
            foreach (var detalle in orden.Detalles)
            {
                if (detalle.TipoBoleto != null)
                    detalle.TipoBoleto.CantidadVendida = Math.Max(0, detalle.TipoBoleto.CantidadVendida - detalle.Cantidad);
            }
            orden.Estado = EstadoOrden.Cancelada;
            orden.UpdatedAt = DateTime.UtcNow;
        }
        // "pending"/"in_process": no se toca, se espera otra notificación
        else
        {
            return;
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Dos notificaciones simultáneas del mismo pago: la segunda choca con el índice único y se ignora
            _logger.LogWarning(ex, "Notificación duplicada para la orden {OrdenId}; ya procesada.", orden.Id);
        }
    }
}
