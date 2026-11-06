using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Domain.Entities;
using MercadoPago.Client.Payment;
using MercadoPago.Client.Preference;
using MercadoPago.Resource.Payment;
using MercadoPago.Resource.Preference;
using Microsoft.Extensions.Configuration;

namespace EventTicketing.Api.Infrastructure.Pagos;

public class MercadoPagoProcesador : IProcesadorPago
{
    private readonly IConfiguration _config;

    public MercadoPagoProcesador(IConfiguration config) => _config = config;

    public async Task<string> CrearPreferenciaAsync(Orden orden)
    {
        var request = new PreferenceRequest
        {
            Items = orden.Detalles.Select(d => new PreferenceItemRequest
            {
                Title = d.TipoBoleto?.Nombre ?? "Boleto",
                Quantity = d.Cantidad,
                CurrencyId = "MXN",
                UnitPrice = d.PrecioUnitario
            }).ToList(),
            ExternalReference = orden.Id.ToString(),
            NotificationUrl = _config["MercadoPago:NotificationUrl"],
            BackUrls = new PreferenceBackUrlsRequest
            {
                Success = _config["MercadoPago:BackUrls:Success"] ?? "miapp://pago-resultado?estado=success",
                Failure = _config["MercadoPago:BackUrls:Failure"] ?? "miapp://pago-resultado?estado=failure",
                Pending = _config["MercadoPago:BackUrls:Pending"] ?? "miapp://pago-resultado?estado=pending"
            }
        };

        var client = new PreferenceClient();
        Preference preference = await client.CreateAsync(request);
        return preference.InitPoint;
    }

    public async Task<ResultadoPago> ConsultarPagoAsync(string idPagoExterno)
    {
        var client = new PaymentClient();
        Payment pago = await client.GetAsync(long.Parse(idPagoExterno));
        return new ResultadoPago(pago.Status, pago.ExternalReference, pago.Id.ToString()!);
    }
}
