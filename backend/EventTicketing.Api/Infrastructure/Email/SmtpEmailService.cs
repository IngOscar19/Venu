using System.Net;
using System.Net.Mail;

namespace EventTicketing.Api.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<EmailResult> EnviarCorreoAsync(string destinatario, string asunto, string cuerpoHtml)
    {
        var smtpEmail = GetConfig("Email") ?? GetConfig("User") ?? "soporte.venu@gmail.com";
        var smtpPassword = GetConfig("Password");
        var smtpHost = GetConfig("Host") ?? "smtp.gmail.com";
        var smtpPortStr = GetConfig("Port") ?? "587";
        var smtpPort = int.TryParse(smtpPortStr, out var p) ? p : 587;

        // Limpiar espacios en la contraseña de aplicación de Google si vienen con espacios
        var cleanPassword = smtpPassword?.Replace(" ", "").Trim();

        if (!string.IsNullOrWhiteSpace(cleanPassword))
        {
            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(smtpEmail, cleanPassword),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(smtpEmail, "Venú Soporte"),
                    Subject = asunto,
                    Body = cuerpoHtml,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(destinatario);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Correo enviado exitosamente vía Gmail SMTP ({Sender}) a {Destinatario}", smtpEmail, destinatario);
                return new EmailResult(true, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar correo vía SMTP a {Destinatario}", destinatario);
                return new EmailResult(false, false, ex.Message);
            }
        }

        // Si no hay contraseña SMTP, intentamos con Resend
        var resendKey = GetConfigVar("Resend", "ApiKey");
        if (!string.IsNullOrWhiteSpace(resendKey))
        {
            var resendService = new ResendEmailService(_config, LoggerFactory.Create(b => {}).CreateLogger<ResendEmailService>());
            return await resendService.EnviarCorreoAsync(destinatario, asunto, cuerpoHtml);
        }

        // Modo Simulado
        _logger.LogInformation("==================================================");
        _logger.LogInformation("✉️ [EMAIL VENU SIMULADO] Destino: {Destinatario}", destinatario);
        _logger.LogInformation("📄 Asunto: {Asunto}", asunto);
        _logger.LogInformation("==================================================");

        await Task.CompletedTask;
        return new EmailResult(true, true);
    }

    private string? GetConfig(string key)
    {
        return GetConfigVar("Smtp", key) ?? GetConfigVar("Gmail", key);
    }

    private string? GetConfigVar(string section, string key)
    {
        var val = _config[$"{section}:{key}"];
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"{section}__{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"{section}:{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"{section.ToUpper()}_{key.ToUpper()}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"{section.ToUpper()}__{key.ToUpper()}");
        return val;
    }
}
