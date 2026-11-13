using System.Net.Http.Headers;
using System.Text;

namespace EventTicketing.Api.Infrastructure.Sms;

public class TwilioOrSimulatedSmsService : ISmsService
{
    private readonly IConfiguration _config;
    private readonly ILogger<TwilioOrSimulatedSmsService> _logger;

    public TwilioOrSimulatedSmsService(IConfiguration config, ILogger<TwilioOrSimulatedSmsService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<SmsResult> EnviarSmsAsync(string telefono, string mensaje)
    {
        var accountSid = GetConfig("AccountSid")?.Trim();
        var authToken = GetConfig("AuthToken")?.Trim();
        var fromNumber = GetConfig("FromNumber")?.Trim();

        // Si Twilio está configurado, enviamos por Twilio API
        if (!string.IsNullOrWhiteSpace(accountSid) && !string.IsNullOrWhiteSpace(authToken) && !string.IsNullOrWhiteSpace(fromNumber))
        {
            try
            {
                using var client = new HttpClient();
                var authBytes = Encoding.ASCII.GetBytes($"{accountSid}:{authToken}");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));

                var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
                var form = new Dictionary<string, string>
                {
                    { "To", telefono },
                    { "From", fromNumber },
                    { "Body", mensaje }
                };

                var response = await client.PostAsync(url, new FormUrlEncodedContent(form));
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("SMS enviado exitosamente vía Twilio a {Telefono}", telefono);
                    return new SmsResult(true, false);
                }
                else
                {
                    _logger.LogWarning("Twilio devolvió código {StatusCode} al enviar SMS a {Telefono}: {Error}",
                        response.StatusCode, telefono, responseBody);
                    return new SmsResult(false, false, responseBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar SMS con Twilio a {Telefono}", telefono);
                return new SmsResult(false, false, ex.Message);
            }
        }

        // Modo Simulado / Desarrollo / Sandbox
        _logger.LogInformation("==================================================");
        _logger.LogInformation("📱 [SMS VENU SIMULADO] Destino: {Telefono}", telefono);
        _logger.LogInformation("💬 Mensaje: {Mensaje}", mensaje);
        _logger.LogInformation("==================================================");

        await Task.CompletedTask;
        return new SmsResult(true, true);
    }

    private string? GetConfig(string key)
    {
        var val = _config[$"Twilio:{key}"];
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"Twilio__{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"Twilio:{key}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"TWILIO_{key.ToUpper()}");
        if (!string.IsNullOrWhiteSpace(val)) return val;
        val = Environment.GetEnvironmentVariable($"TWILIO__{key.ToUpper()}");
        return val;
    }
}
