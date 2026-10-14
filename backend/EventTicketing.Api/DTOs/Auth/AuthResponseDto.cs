namespace EventTicketing.Api.DTOs.Auth;

public record AuthResponseDto(
    string Token,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid? OrganizerId = null,
    string? OrganizerStatus = null
);
