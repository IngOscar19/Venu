using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Auth;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EventTicketing.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _audit;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        IAuditService audit,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _configuration = configuration;
        _audit = audit;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingUser)
        {
            throw new ValidationException("El correo electrónico ya se encuentra registrado.");
        }

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "ORGANIZER" : dto.Role.ToUpper();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        Organizer? organizer = null;
        if (role == "ORGANIZER")
        {
            organizer = new Organizer
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Name = !string.IsNullOrWhiteSpace(dto.OrganizerName) ? dto.OrganizerName : $"{dto.FirstName} {dto.LastName}",
                Description = dto.OrganizerDescription,
                Status = OrganizerStatus.PENDING,
                VerificationLevel = VerificationLevel.Unverified,
                CreatedAt = DateTime.UtcNow
            };
            user.Organizer = organizer;
        }

        _context.Users.Add(user);
        if (organizer != null)
        {
            _context.Organizers.Add(organizer);
        }

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user, organizer?.Id);

        return new AuthResponseDto(
            token,
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            organizer?.Id,
            organizer?.Status.ToString()
        );
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Organizer)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            await _audit.LogAsync(
                action:      AuditActions.UserLoginFailed,
                entityType:  "User",
                entityId:    Guid.Empty,
                userId:      null,
                details:     $"Intento fallido para: {dto.Email}",
                httpContext: _httpContextAccessor.HttpContext);

            throw new UnauthorizedAccessException("Credenciales de acceso incorrectas.");
        }

        var token = GenerateJwtToken(user, user.Organizer?.Id);

        await _audit.LogAsync(
            action:      AuditActions.UserLogin,
            entityType:  "User",
            entityId:    user.Id,
            userId:      user.Id,
            details:     $"Login exitoso: {user.Email}",
            httpContext: _httpContextAccessor.HttpContext);

        return new AuthResponseDto(
            token,
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.Organizer?.Id,
            user.Organizer?.Status.ToString()
        );
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Organizer)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");

        OrganizerProfileDto? organizerDto = null;
        if (user.Organizer != null)
        {
            organizerDto = new OrganizerProfileDto(
                user.Organizer.Id,
                user.Organizer.Name,
                user.Organizer.Description,
                user.Organizer.Status,
                user.Organizer.VerificationLevel
            );
        }

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.CreatedAt,
            organizerDto
        );
    }

    private string GenerateJwtToken(User user, Guid? organizerId)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured.");
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var durationInMinutes = double.TryParse(jwtSettings["DurationInMinutes"], out var minutes) ? minutes : 1440;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
            new(ClaimTypes.Role, user.Role),
            new("role", user.Role)
        };

        if (organizerId.HasValue)
        {
            claims.Add(new Claim("organizerId", organizerId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(durationInMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
