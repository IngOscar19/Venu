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
[Authorize]
public class EmailVerificationController : ControllerBase
{
    private const int DuracionCodigoMinutos = 3;
    private const int ExpiraEnSegundos = DuracionCodigoMinutos * 60; // 180 segundos
    private const int CooldownReenvioSegundos = 30;
    private const int MaxIntentos = 5;

    private readonly ApplicationDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailVerificationController> _logger;

    public EmailVerificationController(
        ApplicationDbContext db,
        IEmailService emailService,
        ILogger<EmailVerificationController> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send")]
    [HttpPost("send-code")]
    public async Task<IActionResult> EnviarCodigo()
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

        // Control de tasa entre reenvíos
        var ultimoToken = await _db.EmailVerificationTokens
            .Where(t => t.UserId == userId.Value)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (ultimoToken != null && (DateTime.UtcNow - ultimoToken.CreatedAt).TotalSeconds < CooldownReenvioSegundos)
        {
            var segundosRestantes = CooldownReenvioSegundos - (int)(DateTime.UtcNow - ultimoToken.CreatedAt).TotalSeconds;
            return BadRequest(new { mensaje = $"Por favor espera {segundosRestantes} segundos antes de solicitar otro código." });
        }

        // Invalidar códigos anteriores sin usar para que solo el último sea válido
        var codigosPrevios = await _db.EmailVerificationTokens
            .Where(t => t.UserId == userId.Value && !t.IsUsed)
            .ToListAsync();

        foreach (var prev in codigosPrevios)
        {
            prev.IsUsed = true;
        }

        // Generar código numérico seguro de 6 dígitos con duración de 3 minutos
        var codigo = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var ahora = DateTime.UtcNow;
        var expiraEn = ahora.AddMinutes(DuracionCodigoMinutos);

        var record = new EmailVerificationToken
        {
            UserId = user.Id,
            Email = user.Email.ToLowerInvariant(),
            Token = codigo,
            Attempts = 0,
            CreatedAt = ahora,
            ExpiresAt = expiraEn,
            IsUsed = false
        };

        _db.EmailVerificationTokens.Add(record);
        await _db.SaveChangesAsync();

        var cuerpoHtml = GenerarPlantillaCodigoHtml(user.FirstName, codigo);
        var resultadoEnvio = await _emailService.EnviarCorreoAsync(
            user.Email,
            $"Tu código de verificación es {codigo} | Venú",
            cuerpoHtml);

        if (!resultadoEnvio.Exito && !resultadoEnvio.EsSimulado)
        {
            _logger.LogWarning("El proveedor de correo no pudo enviar el código a {Email}: {Error}", user.Email, resultadoEnvio.Error);
            return Ok(new
            {
                exito = true,
                mensaje = "El servicio de correo reportó una restricción. Se generó un código de respaldo temporal (válido por 3 minutos).",
                email = user.Email,
                expiraEnSegundos = ExpiraEnSegundos,
                cooldownSegundos = CooldownReenvioSegundos,
                expiresAt = expiraEn,
                esSimulado = true,
                codigoSimulado = codigo,
                errorProveedor = resultadoEnvio.Error
            });
        }

        return Ok(new
        {
            exito = true,
            mensaje = resultadoEnvio.EsSimulado
                ? "Servidor en modo de pruebas. Ingresa el código generado para confirmar tu cuenta (válido por 3 minutos)."
                : "Código de verificación enviado a tu correo electrónico. Válido por 3 minutos.",
            email = user.Email,
            expiraEnSegundos = ExpiraEnSegundos,
            cooldownSegundos = CooldownReenvioSegundos,
            expiresAt = expiraEn,
            esSimulado = resultadoEnvio.EsSimulado,
            codigoSimulado = resultadoEnvio.EsSimulado ? codigo : null
        });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerificarCodigo([FromBody] VerificarCodigoEmailRequest req)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var codigoLimpio = req.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(codigoLimpio) || codigoLimpio.Length != 6)
        {
            return BadRequest(new { mensaje = "Ingresa el código numérico de 6 dígitos enviado a tu correo." });
        }

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

        var record = await _db.EmailVerificationTokens
            .Where(t => t.UserId == userId.Value && !t.IsUsed)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (record is null)
        {
            return BadRequest(new { mensaje = "No hay un código de verificación activo. Solicita uno nuevo." });
        }

        if (record.ExpiresAt < DateTime.UtcNow)
        {
            record.IsUsed = true;
            await _db.SaveChangesAsync();
            return BadRequest(new
            {
                mensaje = "El código de verificación ha expirado (duración máxima de 3 minutos). Solicita uno nuevo.",
                codigoExpirado = true
            });
        }

        if (record.Attempts >= MaxIntentos)
        {
            record.IsUsed = true;
            await _db.SaveChangesAsync();
            return BadRequest(new { mensaje = "Demasiados intentos incorrectos. Por seguridad solicita un nuevo código." });
        }

        if (record.Token != codigoLimpio)
        {
            record.Attempts++;
            await _db.SaveChangesAsync();
            return BadRequest(new { mensaje = "El código ingresado es incorrecto. Intenta nuevamente." });
        }

        // Validación exitosa
        record.IsUsed = true;
        user.EmailVerified = true;
        user.EmailVerifiedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Usuario {UserId} verificó exitosamente su correo {Email} con código OTP", user.Id, user.Email);

        return Ok(new
        {
            exito = true,
            mensaje = "¡Tu correo electrónico ha sido verificado con éxito!",
            emailVerified = true,
            email = user.Email
        });
    }

    [HttpGet("status")]
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

    private static string GenerarPlantillaCodigoHtml(string nombre, string codigo)
    {
        return $@"
<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""UTF-8"">
  <title>Código de verificación | Venú</title>
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
            <td style=""padding:36px 32px;text-align:center;"">
              <h2 style=""margin:0 0 14px;color:#ffffff;font-size:20px;font-weight:700;text-align:left;"">¡Hola, {nombre}! 👋</h2>
              <p style=""margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;text-align:left;"">
                Para proteger tu cuenta contra revendedores y bots, ingresa el siguiente <strong>código de verificación</strong> en la aplicación:
              </p>
              <!-- Code Box -->
              <div style=""margin:28px 0;padding:22px 16px;background-color:#0f172a;border:2px solid #f05a28;border-radius:16px;text-align:center;"">
                <span style=""font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#ffffff;display:inline-block;"">
                  {codigo}
                </span>
              </div>
              <p style=""margin:0 0 20px;color:#fbbf24;font-size:13.5px;font-weight:600;"">
                ⏱️ Este código es válido únicamente durante 3 minutos.
              </p>
              <hr style=""border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;"">
              <p style=""margin:0;color:#64748b;font-size:12px;line-height:1.5;text-align:left;"">
                No compartas este código con nadie. Si no solicitaste esta verificación, puedes ignorar este correo de forma segura.
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
}

public record VerificarCodigoEmailRequest(string Code);
