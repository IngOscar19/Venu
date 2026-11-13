using System.Security.Cryptography;
using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Infrastructure.Email;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/email-verification")]
public class EmailVerificationController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailVerificationController> _logger;

    public EmailVerificationController(
        ApplicationDbContext db,
        IEmailService emailService,
        IConfiguration config,
        ILogger<EmailVerificationController> logger)
    {
        _db = db;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    [HttpPost("send")]
    [Authorize]
    public async Task<IActionResult> EnviarEnlace()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null) return NotFound(new { mensaje = "Usuario no encontrado." });

        if (user.EmailVerified)
        {
            return Ok(new
            {
                exito = true,
                mensaje = "Tu correo electrónico ya se encuentra verificado.",
                emailVerified = true,
                email = user.Email
            });
        }

        // Control de tasa: mínimo 45 segundos entre reenvíos
        var ultimoToken = await _db.EmailVerificationTokens
            .Where(t => t.UserId == userId.Value)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (ultimoToken != null && (DateTime.UtcNow - ultimoToken.CreatedAt).TotalSeconds < 45)
        {
            var segundosRestantes = 45 - (int)(DateTime.UtcNow - ultimoToken.CreatedAt).TotalSeconds;
            return BadRequest(new { mensaje = $"Por favor espera {segundosRestantes} segundos antes de solicitar otro correo." });
        }

        // Token seguro y único de 64 caracteres
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToHexString(tokenBytes).ToLower();

        var record = new EmailVerificationToken
        {
            UserId = user.Id,
            Email = user.Email.ToLower(),
            Token = token,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };

        _db.EmailVerificationTokens.Add(record);
        await _db.SaveChangesAsync();

        // Determinar URL pública del backend
        var baseUrl = _config["App:BackendUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            baseUrl = Environment.GetEnvironmentVariable("APP__BACKENDURL")
                ?? Environment.GetEnvironmentVariable("App__BackendUrl")
                ?? $"{Request.Scheme}://{Request.Host}";
        }
        if (baseUrl.Contains("localhost") && !string.IsNullOrWhiteSpace(_config["WEBSITE_HOSTNAME"]))
        {
            baseUrl = $"https://{_config["WEBSITE_HOSTNAME"]}";
        }

        var verificationUrl = $"{baseUrl.TrimEnd('/')}/api/email-verification/verify?token={token}";

        var cuerpoHtml = GenerarPlantillaHtml(user.FirstName, verificationUrl);
        var resultadoEnvio = await _emailService.EnviarCorreoAsync(
            user.Email,
            "Verifica tu cuenta para tus boletos oficiales | Venú",
            cuerpoHtml);

        if (!resultadoEnvio.Exito && !resultadoEnvio.EsSimulado)
        {
            _logger.LogWarning("Resend no pudo enviar el correo a {Email}: {Error}", user.Email, resultadoEnvio.Error);
            return Ok(new
            {
                exito = true,
                mensaje = "El servicio de correo reportó una restricción. Puedes confirmar tu cuenta con el enlace directo:",
                email = user.Email,
                esSimulado = true,
                urlSimulada = verificationUrl,
                errorProveedor = resultadoEnvio.Error
            });
        }

        return Ok(new
        {
            exito = true,
            mensaje = resultadoEnvio.EsSimulado
                ? "Servidor en modo de pruebas. Haz clic en el enlace de verificación para confirmar tu cuenta."
                : "Enlace de verificación enviado a tu correo.",
            email = user.Email,
            esSimulado = resultadoEnvio.EsSimulado,
            urlSimulada = resultadoEnvio.EsSimulado ? verificationUrl : null
        });
    }

    [HttpGet("verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerificarEnlace([FromQuery] string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Content(GenerarRespuestaHtml(false, "El enlace de verificación es inválido."), "text/html");
        }

        var tokenRecord = await _db.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);

        if (tokenRecord is null || tokenRecord.IsUsed || tokenRecord.ExpiresAt < DateTime.UtcNow)
        {
            return Content(GenerarRespuestaHtml(false, "Este enlace de verificación ha expirado o ya fue utilizado. Por favor solicita uno nuevo desde la aplicación."), "text/html");
        }

        // Validación exitosa
        tokenRecord.IsUsed = true;
        tokenRecord.User.EmailVerified = true;
        tokenRecord.User.EmailVerifiedAt = DateTime.UtcNow;
        tokenRecord.User.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Usuario {UserId} verificó exitosamente su correo {Email}", tokenRecord.User.Id, tokenRecord.User.Email);

        return Content(GenerarRespuestaHtml(true, "¡Tu correo ha sido verificado con éxito!"), "text/html");
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> ObtenerEstado()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null) return NotFound();

        return Ok(new
        {
            emailVerified = user.EmailVerified,
            email = user.Email,
            emailVerifiedAt = user.EmailVerifiedAt
        });
    }

    private static string GenerarPlantillaHtml(string nombre, string link)
    {
        return $@"
<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""UTF-8"">
  <title>Verifica tu cuenta en Venú</title>
</head>
<body style=""margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;"">
  <table role=""presentation"" width=""100%"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""background-color:#0f172a;padding:40px 10px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" max-width=""560px"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""max-width:560px;background-color:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 40px rgba(0,0,0,0.4);"">
          <!-- Header Banner -->
          <tr>
            <td style=""background:linear-gradient(135deg,#f05a28 0%,#d94817 100%);padding:36px 30px;text-align:center;"">
              <h1 style=""margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;"">Venú</h1>
              <p style=""margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;"">Plataforma Oficial de Venta de Boletos</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style=""padding:36px 32px;"">
              <h2 style=""margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:700;"">¡Hola, {nombre}! 👋</h2>
              <p style=""margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;"">
                Para proteger tu cuenta contra revendedores y bots, y asegurar que tus boletos con <strong>código QR dinámico</strong> se asocien de forma segura a ti, confirma tu cuenta haciendo clic en el siguiente botón:
              </p>
              <!-- Button -->
              <table role=""presentation"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""margin:30px 0;"">
                <tr>
                  <td align=""center"" style=""border-radius:14px;background-color:#f05a28;"">
                    <a href=""{link}"" target=""_blank"" style=""display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:0.3px;"">
                      Confirmar mi cuenta y continuar compra →
                    </a>
                  </td>
                </tr>
              </table>
              <p style=""margin:0 0 12px;color:#64748b;font-size:12px;line-height:1.5;"">
                Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
              </p>
              <p style=""margin:0 0 24px;word-break:break-all;color:#f05a28;font-size:12px;"">
                {link}
              </p>
              <hr style=""border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;"">
              <p style=""margin:0;color:#64748b;font-size:12px;line-height:1.4;"">
                Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este mensaje de forma segura.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }

    private static string GenerarRespuestaHtml(bool exito, string mensaje)
    {
        var iconColor = exito ? "#10b981" : "#ef4444";
        var iconSvg = exito
            ? @"<svg width=""64"" height=""64"" viewBox=""0 0 24 24"" fill=""none"" stroke=""#10b981"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><path d=""M22 11.08V12a10 10 0 1 1-5.93-9.14""></path><polyline points=""22 4 12 14.01 9 11.01""></polyline></svg>"
            : @"<svg width=""64"" height=""64"" viewBox=""0 0 24 24"" fill=""none"" stroke=""#ef4444"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><circle cx=""12"" cy=""12"" r=""10""></circle><line x1=""15"" y1=""9"" x2=""9"" y2=""15""></line><line x1=""9"" y1=""9"" x2=""15"" y2=""15""></line></svg>";

        var titulo = exito ? "¡Cuenta Verificada con Éxito!" : "Enlace Inválido o Expirado";
        var subtitulo = exito
            ? "Tu correo electrónico ha sido confirmado en la plataforma de Venú. Ya puedes volver a la aplicación móvil para completar tu compra de boletos."
            : mensaje;

        return $@"
<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Venú | Verificación de Cuenta</title>
  <style>
    body {{
      margin: 0;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #ffffff;
      padding: 20px;
      box-sizing: border-box;
    }}
    .card {{
      background: #1e293b;
      max-width: 460px;
      width: 100%;
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .icon-wrap {{
      display: inline-flex;
      padding: 16px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 12px;
      letter-spacing: -0.5px;
    }}
    p {{
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 32px;
    }}
    .btn {{
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      background: #f05a28;
      color: #ffffff;
      padding: 15px 24px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      transition: background 0.2s;
    }}
    .btn:hover {{
      background: #d94817;
    }}
    .footer-note {{
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class=""card"">
    <div class=""icon-wrap"">
      {iconSvg}
    </div>
    <h1>{titulo}</h1>
    <p>{subtitulo}</p>
    <a href=""miapp://email-verified"" class=""btn"">Abrir aplicación Venú</a>
    <div class=""footer-note"">Venú • Plataforma Oficial de Boletos</div>
  </div>
</body>
</html>";
    }
}
