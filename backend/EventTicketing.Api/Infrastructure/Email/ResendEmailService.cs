using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace EventTicketing.Api.Infrastructure.Email;

public class ResendEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IConfiguration config, ILogger<ResendEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<EmailResult> EnviarCorreoAsync(string destinatario, string asunto, string cuerpoHtml)
    {
        var apiKey = GetConfig("ApiKey")?.Trim();
        var fromEmail = GetConfig("FromEmail")?.Trim();
        if (string.IsNullOrWhiteSpace(fromEmail))
        {
            fromEmail = "Venú <onboarding@resend.dev>";
        }

        // Si la clave de Resend está presente, enviamos vía Resend API
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var payload = new
                {
                    from = fromEmail,
                    to = new[] { destinatario },
                    subject = asunto,
                    html = cuerpoHtml
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PostAsync("https://api.resend.com/emails", jsonContent);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Correo enviado exitosamente vía Resend a {Destinatario}", destinatario);
                    return new EmailResult(true, false);
                }
                else
                {
                    _logger.LogWarning("Resend devolvió error {StatusCode} al enviar a {Destinatario}: {Error}",
                        response.StatusCode, destinatario, responseBody);
                    return new EmailResult(false, false, responseBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar correo con Resend a {Destinatario}", destinatario);
                return new EmailResult(false, false, ex.Message);
            }
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
        var val = _config[$"Resend:{key}"];
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"Resend__{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"Resend:{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"RESEND_{key.ToUpper()}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"RESEND__{key.ToUpper()}");
        return val;
    }
}
