using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace EventTicketing.Api.Services.Implementations;

public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _environment;
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".svg" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public LocalStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0)
        {
            throw new ValidationException("No se ha proporcionado ningún archivo o el archivo está vacío.");
        }

        if (file.Length > MaxFileSize)
        {
            throw new ValidationException("El archivo supera el tamaño máximo permitido de 10 MB.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new ValidationException($"Extensión no permitida. Formatos aceptados: {string.Join(", ", AllowedExtensions)}");
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", subFolder);

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/{subFolder}/{uniqueFileName}";
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
        {
            return Task.CompletedTask;
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var relativePath = fileUrl.TrimStart('/');
        var fullPath = Path.Combine(webRoot, relativePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }
}
