using System.Security.Cryptography;
using System.Text.RegularExpressions;
using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Infrastructure.Sms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/phone-verification")]
[Authorize]
public class PhoneVerificationController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ISmsService _smsService;
    private readonly ILogger<PhoneVerificationController> _logger;

    public PhoneVerificationController(
        ApplicationDbContext db,
        ISmsService smsService,
        ILogger<PhoneVerificationController> logger)
    {
        _db = db;
        _smsService = smsService;
        _logger = logger;
    }

    [HttpPost("send-code")]
    public async Task<IActionResult> EnviarCodigo([FromBody] EnviarCodigoSmsRequest req)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var phoneLimpio = NormalizarTelefono(req.PhoneNumber);
        if (string.IsNullOrWhiteSpace(phoneLimpio) || phoneLimpio.Length < 10)
        {
            return BadRequest(new { mensaje = "Por favor ingresa un número de teléfono móvil válido (10 dígitos)." });
        }

        // Anti-reventa y anti-sybil: un mismo teléfono no puede estar verificado en múltiples cuentas
        var telefonoEnUso = await _db.Users
            .AnyAsync(u => u.Id != userId.Value && u.PhoneNumber == phoneLimpio && u.PhoneVerified);
        if (telefonoEnUso)
        {
            return Conflict(new { mensaje = "Este número de teléfono ya se encuentra verificado en otra cuenta de Venu." });
        }

        // Control de tasa (Rate limit por usuario): mínimo 45 segundos entre reenvíos
        var ultimoEnvio = await _db.PhoneVerificationCodes
            .Where(c => c.UserId == userId.Value)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (ultimoEnvio != null && (DateTime.UtcNow - ultimoEnvio.CreatedAt).TotalSeconds < 45)
        {
            var segundosRestantes = 45 - (int)(DateTime.UtcNow - ultimoEnvio.CreatedAt).TotalSeconds;
            return BadRequest(new { mensaje = $"Por favor espera {segundosRestantes} segundos antes de solicitar otro código." });
        }

        // Generar código numérico de 6 dígitos
        var codigo = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        var verificationRecord = new PhoneVerificationCode
        {
            UserId = userId.Value,
            PhoneNumber = phoneLimpio,
            Code = codigo,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            Attempts = 0,
            IsUsed = false
        };

        _db.PhoneVerificationCodes.Add(verificationRecord);
        await _db.SaveChangesAsync();

        var mensajeSms = $"Tu código de verificación de Venu es: {codigo}. Válido por 10 minutos. No lo compartas con nadie.";
        var enviado = await _smsService.EnviarSmsAsync(phoneLimpio, mensajeSms);

        if (!enviado)
        {
            _logger.LogWarning("No se pudo enviar el SMS al número {Phone}", phoneLimpio);
        }

        return Ok(new
        {
            exito = true,
            mensaje = "Código enviado por SMS exitosamente.",
            telefono = phoneLimpio,
            expiraEnSegundos = 600
        });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerificarCodigo([FromBody] VerificarCodigoSmsRequest req)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var phoneLimpio = NormalizarTelefono(req.PhoneNumber);
        var codigoLimpio = req.Code?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(codigoLimpio))
        {
            return BadRequest(new { mensaje = "El código de verificación es requerido." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null) return NotFound(new { mensaje = "Usuario no encontrado." });

        var record = await _db.PhoneVerificationCodes
            .Where(c => c.UserId == userId.Value && c.PhoneNumber == phoneLimpio && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (record is null || record.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { mensaje = "El código ha expirado o no existe. Solicita uno nuevo." });
        }

        if (record.Attempts >= 5)
        {
            return BadRequest(new { mensaje = "Demasiados intentos incorrectos. Por seguridad solicita un nuevo código." });
        }

        if (record.Code != codigoLimpio)
        {
            record.Attempts++;
            await _db.SaveChangesAsync();
            return BadRequest(new { mensaje = "El código ingresado es incorrecto. Intenta nuevamente." });
        }

        // Código válido
        record.IsUsed = true;
        user.PhoneNumber = phoneLimpio;
        user.PhoneVerified = true;
        user.PhoneVerifiedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Usuario {UserId} verificó exitosamente su teléfono {Phone}", user.Id, phoneLimpio);

        return Ok(new
        {
            exito = true,
            mensaje = "¡Teléfono verificado con éxito!",
            phoneVerified = true,
            phoneNumber = phoneLimpio
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
            phoneVerified = user.PhoneVerified,
            phoneNumber = user.PhoneNumber,
            phoneVerifiedAt = user.PhoneVerifiedAt
        });
    }

    private static string NormalizarTelefono(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var digits = Regex.Replace(phone, @"[^\d+]", "");
        if (digits.StartsWith("+")) return digits;
        if (digits.Length == 10) return $"+52{digits}";
        if (digits.Length == 12 && digits.StartsWith("52")) return $"+{digits}";
        return $"+{digits}";
    }
}

public record EnviarCodigoSmsRequest(string PhoneNumber);
public record VerificarCodigoSmsRequest(string PhoneNumber, string Code);
