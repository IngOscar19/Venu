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

    public async Task<bool> EjecutarAsync(ResultadoPago resultado)
    {
        if (!Guid.TryParse(resultado.OrdenId, out var ordenId))
        {
            _logger.LogWarning("Pago {PagoId} con external_reference inválida: {Ref}", resultado.IdPagoExterno, resultado.OrdenId);
            return false;
        }

        var orden = await _db.Ordenes
            .Include(o => o.User)
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .Include(o => o.Pago)
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.Id == ordenId);

        if (orden is null)
        {
            _logger.LogWarning("Orden {OrdenId} no encontrada para confirmar pago {PagoId}", resultado.OrdenId, resultado.IdPagoExterno);
            return false;
        }

        var aprobado = string.Equals(resultado.Estado, "approved", StringComparison.OrdinalIgnoreCase);

        // Idempotencia: este pago ya fue registrado
        if (orden.Pago is not null && orden.Pago.ReferenciaExterna == resultado.IdPagoExterno)
        {
            if (aprobado && (orden.Estado != EstadoOrden.Pagada || orden.Tickets.Count == 0))
            {
                orden.Estado = EstadoOrden.Pagada;
                orden.UpdatedAt = DateTime.UtcNow;
                await _generarBoletos.GenerarDesdeOrdenAsync(orden);
                await _db.SaveChangesAsync();
            }
            return aprobado;
        }

        if (aprobado)
        {
            _logger.LogInformation("Confirmando pago aprobado {PagoId} para orden {OrdenId}. Monto cobrado={Monto}, Total orden={Total}",
                resultado.IdPagoExterno, orden.Id, resultado.Monto, orden.Total);

            orden.Estado = EstadoOrden.Pagada;
            orden.UpdatedAt = DateTime.UtcNow;

            if (orden.Pago != null)
            {
                orden.Pago.Monto = resultado.Monto ?? orden.Total;
                orden.Pago.MetodoPago = resultado.MetodoPago ?? "mercadopago";
                orden.Pago.Estado = "approved";
                orden.Pago.ReferenciaExterna = resultado.IdPagoExterno;
                orden.Pago.Fecha = DateTime.UtcNow;
            }
            else
            {
                orden.Pago = new Pago
                {
                    OrdenId = orden.Id,
                    Monto = resultado.Monto ?? orden.Total,
                    MetodoPago = resultado.MetodoPago ?? "mercadopago",
                    Estado = "approved",
                    ReferenciaExterna = resultado.IdPagoExterno,
                    Fecha = DateTime.UtcNow
                };
            }

            await _generarBoletos.GenerarDesdeOrdenAsync(orden);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Orden {OrdenId} acreditada exitosamente con boletos.", orden.Id);
            return true;
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

            if (orden.Pago != null)
            {
                orden.Pago.Estado = resultado.Estado;
                orden.Pago.ReferenciaExterna = resultado.IdPagoExterno;
            }
            else
            {
                orden.Pago = new Pago
                {
                    OrdenId = orden.Id,
                    Monto = resultado.Monto ?? orden.Total,
                    MetodoPago = resultado.MetodoPago ?? "mercadopago",
                    Estado = resultado.Estado,
                    ReferenciaExterna = resultado.IdPagoExterno,
                    Fecha = DateTime.UtcNow
                };
            }

            await _db.SaveChangesAsync();
            return false;
        }

        return false;
    }
}
