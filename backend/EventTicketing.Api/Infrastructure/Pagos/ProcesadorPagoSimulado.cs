using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Domain.Entities;

namespace EventTicketing.Api.Infrastructure.Pagos;

/// <summary>
/// Procesador de pago SOLO PARA PRUEBAS (Pagos:Simulado=true). No contacta a Mercado Pago ni cobra nada:
/// el "checkout" es una página del propio backend (PagosController, rutas simulado/*) que aprueba o
/// rechaza la orden usando el mismo ConfirmarPagoCommand que el flujo real.
/// </summary>
public class ProcesadorPagoSimulado : IProcesadorPago
{
    private readonly IHttpContextAccessor _http;

    public ProcesadorPagoSimulado(IHttpContextAccessor http) => _http = http;

    public Task<string> CrearPreferenciaAsync(Orden orden)
    {
        var req = _http.HttpContext?.Request
            ?? throw new InvalidOperationException("No hay contexto HTTP para construir la URL del pago simulado.");

        var esLocal = req.Host.Host is "localhost" or "127.0.0.1" or "10.0.2.2";
        var esquema = esLocal ? req.Scheme : "https"; // detrás del proxy de Azure el esquema llega como http
        var url = $"{esquema}://{req.Host}/api/pagos/simulado/{orden.Id}/checkout";
        return Task.FromResult(url);
    }

    public Task<ResultadoPago> ConsultarPagoAsync(string idPagoExterno) =>
        throw new NotSupportedException("El pago simulado no se consulta: se confirma directamente desde el checkout simulado.");

    public Task ReembolsarAsync(string idPagoExterno) => Task.CompletedTask;
}
