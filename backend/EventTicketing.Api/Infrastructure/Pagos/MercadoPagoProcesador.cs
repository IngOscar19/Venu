using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Domain.Entities;
using MercadoPago.Client.Payment;
using MercadoPago.Client.Preference;
using MercadoPago.Resource.Payment;
using MercadoPago.Resource.Preference;

namespace EventTicketing.Api.Infrastructure.Pagos;

public class MercadoPagoProcesador : IProcesadorPago
{
    private static readonly TimeSpan VigenciaPreferencia = TimeSpan.FromMinutes(15);
    private readonly IConfiguration _config;

    public MercadoPagoProcesador(IConfiguration config) => _config = config;

    public async Task<string> CrearPreferenciaAsync(Orden orden)
    {
        var success = _config["MercadoPago:BackUrls:Success"] ?? "miapp://pago-resultado?estado=success";
        var failure = _config["MercadoPago:BackUrls:Failure"] ?? "miapp://pago-resultado?estado=failure";
        var pending = _config["MercadoPago:BackUrls:Pending"] ?? "miapp://pago-resultado?estado=pending";

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
            BackUrls = new PreferenceBackUrlsRequest { Success = success, Failure = failure, Pending = pending },
            // La preferencia vence junto con la reserva de inventario (15 min)
            Expires = true,
            ExpirationDateFrom = DateTime.UtcNow,
            ExpirationDateTo = orden.Fecha.ToUniversalTime().Add(VigenciaPreferencia)
        };

        // auto_return solo es válido con back_urls https
        if (success.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            request.AutoReturn = "approved";

        // En modo prueba (MercadoPago:Sandbox=true) no se envía el correo de un usuario real como pagador:
        // Mercado Pago rechaza mezclar un comprador real con un vendedor de prueba ("una de las partes es de prueba").
        // Hoy las credenciales de prueba también empiezan con APP_USR-, por eso se usa un flag y no el prefijo.
        // Opcionalmente se puede forzar el correo del comprador de prueba con MercadoPago:TestPayerEmail.
        var esSandbox = _config.GetValue<bool>("MercadoPago:Sandbox");
        var correoPrueba = _config["MercadoPago:TestPayerEmail"];

        if (esSandbox)
        {
            if (!string.IsNullOrWhiteSpace(correoPrueba))
                request.Payer = new PreferencePayerRequest { Email = correoPrueba };
        }
        else if (!string.IsNullOrWhiteSpace(orden.User?.Email))
        {
            request.Payer = new PreferencePayerRequest
            {
                Email = orden.User.Email,
                Name = orden.User.FirstName,
                Surname = orden.User.LastName
            };
        }

        var client = new PreferenceClient();
        Preference preference = await client.CreateAsync(request);
        return preference.InitPoint;
    }

    public async Task<ResultadoPago> ConsultarPagoAsync(string idPagoExterno)
    {
        var client = new PaymentClient();
        Payment pago = await client.GetAsync(long.Parse(idPagoExterno));
        return new ResultadoPago(
            pago.Status,
            pago.ExternalReference ?? string.Empty,
            pago.Id.ToString()!,
            pago.TransactionAmount,
            pago.PaymentMethodId);
    }

    public async Task ReembolsarAsync(string idPagoExterno)
    {
        var client = new PaymentRefundClient();
        await client.RefundAsync(long.Parse(idPagoExterno));
    }
}
