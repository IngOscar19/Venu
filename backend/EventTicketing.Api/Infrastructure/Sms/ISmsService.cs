namespace EventTicketing.Api.Infrastructure.Sms;

public interface ISmsService
{
    Task<bool> EnviarSmsAsync(string telefono, string mensaje);
}
