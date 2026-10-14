using System.ComponentModel.DataAnnotations;

namespace EventTicketing.Api.DTOs.Auth;

public record LoginDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);
