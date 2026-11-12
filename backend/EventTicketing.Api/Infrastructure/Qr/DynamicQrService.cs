using System.Security.Cryptography;
using System.Text;

namespace EventTicketing.Api.Infrastructure.Qr;

public interface IDynamicQrService
{
    string GenerarSeed(Guid ticketId, string ticketCode);
    string GenerarCodigoDinamico(string ticketCode, string seed, long? unixSeconds = null);
    bool ValidarFirma(string ticketCode, string seed, long window, string signature);
}

public class DynamicQrService : IDynamicQrService
{
    public const int VentanaSegundos = 20;
    private readonly string _secretKey;

    public DynamicQrService(IConfiguration config)
    {
        _secretKey = config["JwtSettings:Secret"] ?? "VenuSuperSecretDynamicQrKey2026!";
    }

    public string GenerarSeed(Guid ticketId, string ticketCode)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var raw = $"{ticketId}:{ticketCode}";
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public string GenerarCodigoDinamico(string ticketCode, string seed, long? unixSeconds = null)
    {
        var seconds = unixSeconds ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var window = seconds / VentanaSegundos;
        using var hmac = new HMACSHA256(Convert.FromHexString(seed));
        var payload = $"{ticketCode}:{window}";
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        var signature = hash[..8].ToUpperInvariant();
        return $"DYN:{ticketCode}:{window}:{signature}";
    }

    public bool ValidarFirma(string ticketCode, string seed, long window, string signature)
    {
        using var hmac = new HMACSHA256(Convert.FromHexString(seed));
        var payload = $"{ticketCode}:{window}";
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        var expected = hash[..8].ToUpperInvariant();
        return string.Equals(expected, signature, StringComparison.OrdinalIgnoreCase);
    }
}
