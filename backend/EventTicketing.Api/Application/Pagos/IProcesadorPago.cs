using EventTicketing.Api.Domain.Entities;

namespace EventTicketing.Api.Application.Pagos;

public interface IProcesadorPago
{
    Task<string> CrearPreferenciaAsync(Orden orden);
    Task<ResultadoPago> ConsultarPagoAsync(string idPagoExterno);
    Task ReembolsarAsync(string idPagoExterno);
}

public record ResultadoPago(string Estado, string OrdenId, string IdPagoExterno, decimal? Monto = null, string? MetodoPago = null);
