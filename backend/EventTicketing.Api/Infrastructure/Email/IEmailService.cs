namespace EventTicketing.Api.Infrastructure.Email;

public record EmailResult(bool Exito, bool EsSimulado, string? Error = null);

public interface IEmailService
{
    Task<EmailResult> EnviarCorreoAsync(string destinatario, string asunto, string cuerpoHtml);
}
