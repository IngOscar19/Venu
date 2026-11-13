using System.ComponentModel.DataAnnotations;

namespace EventTicketing.Api.DTOs.Auth;

public record ChangePasswordDto(
    [Required(ErrorMessage = "La contraseña actual es requerida.")]
    string CurrentPassword,

    [Required(ErrorMessage = "La nueva contraseña es requerida.")]
    [MinLength(6, ErrorMessage = "La nueva contraseña debe tener al menos 6 caracteres.")]
    string NewPassword
);
