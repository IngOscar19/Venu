using EventTicketing.Api.Application.Boletos;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Pagos;

public class ConfirmarPagoCommand
{
    private readonly AppDbContext _db;
    private readonly GenerarBoletosService _generarBoletos;

    public ConfirmarPagoCommand(AppDbContext db, GenerarBoletosService generarBoletos)
    {
        _db = db;
        _generarBoletos = generarBoletos;
    }

    public async Task EjecutarAsync(ResultadoPago resultado)
    {
        var orden = await _db.Ordenes
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .Include(o => o.Pago)
            .FirstOrDefaultAsync(o => o.Id == Guid.Parse(resultado.OrdenId));

        if (orden is null || orden.Estado != EstadoOrden.Pendiente) return; // idempotencia: ya procesada o no existe

        if (resultado.Estado == "approved")
        {
            orden.Estado = EstadoOrden.Pagada;
            orden.Pago = new Pago
            {
                OrdenId = orden.Id,
                Monto = orden.Total,
                Estado = resultado.Estado,
                ReferenciaExterna = resultado.IdPagoExterno
            };
            await _generarBoletos.GenerarParaOrdenAsync(orden);
        }
        else if (resultado.Estado is "rejected" or "cancelled")
        {
            orden.Estado = EstadoOrden.Cancelada;
        }
        // "pending": no se toca, se espera otra notificación

        await _db.SaveChangesAsync();
    }
}
