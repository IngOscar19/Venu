using EventTicketing.Api.DTOs.Auth;

namespace EventTicketing.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserProfileDto> GetProfileAsync(Guid userId);
}
