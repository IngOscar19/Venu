namespace EventTicketing.Api.Infrastructure.Sms;

public record SmsResult(bool Exito, bool EsSimulado, string? Error = null);

public interface ISmsService
{
    Task<SmsResult> EnviarSmsAsync(string telefono, string mensaje);
}
