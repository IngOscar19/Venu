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

    public async Task<bool> EnviarSmsAsync(string telefono, string mensaje)
    {
        var accountSid = _config["Twilio:AccountSid"];
        var authToken = _config["Twilio:AuthToken"];
        var fromNumber = _config["Twilio:FromNumber"];

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
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("SMS enviado exitosamente vía Twilio a {Telefono}", telefono);
                    return true;
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Twilio devolvió código {StatusCode} al enviar SMS a {Telefono}: {Error}",
                        response.StatusCode, telefono, errorBody);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar SMS con Twilio a {Telefono}", telefono);
                return false;
            }
        }

        // Modo Simulado / Desarrollo / Sandbox
        _logger.LogInformation("==================================================");
        _logger.LogInformation("📱 [SMS VENU SIMULADO] Destino: {Telefono}", telefono);
        _logger.LogInformation("💬 Mensaje: {Mensaje}", mensaje);
        _logger.LogInformation("==================================================");

        await Task.CompletedTask;
        return true;
    }
}
