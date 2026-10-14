using System.ComponentModel.DataAnnotations;

namespace EventTicketing.Api.DTOs.Auth;

public record RegisterDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string FirstName,
    [Required] string LastName,
    string? Role = "ORGANIZER",
    string? OrganizerName = null,
    string? OrganizerDescription = null
);
