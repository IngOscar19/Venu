using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Auth;

public record OrganizerProfileDto(
    Guid Id,
    string Name,
    string? Description,
    OrganizerStatus Status,
    VerificationLevel VerificationLevel  // ← agregado
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    DateTime CreatedAt,
    OrganizerProfileDto? Organizer
);