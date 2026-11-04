using QRCoder;

namespace EventTicketing.Api.Infrastructure.Qr;

public interface IGeneradorQr
{
    byte[] GenerarPng(string contenido);
}

public class QrCoderGenerador : IGeneradorQr
{
    public byte[] GenerarPng(string contenido)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20); // 20 = tamaño de cada "pixel" del QR
    }
}
