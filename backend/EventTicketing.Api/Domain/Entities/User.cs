namespace EventTicketing.Api.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // ADMIN | ORGANIZER | CUSTOMER | ACCESS_OPERATOR
    // Guardado como string para legibilidad en BD y seguridad ante reordenamiento
    public string Role { get; set; } = "ORGANIZER";

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Organizer? Organizer { get; set; }
}
