using Microsoft.AspNetCore.Http;

namespace EventTicketing.Api.Services.Interfaces;

public interface IStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subFolder);
    Task DeleteFileAsync(string fileUrl);
}
