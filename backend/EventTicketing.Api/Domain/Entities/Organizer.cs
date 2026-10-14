using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class Organizer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public OrganizerStatus Status { get; set; } = OrganizerStatus.PENDING; // ← PENDING por defecto ahora

    /// <summary>
    /// Nivel de verificación KYC actual.
    /// Controla qué puede publicar el organizador.
    /// Se actualiza cuando el admin aprueba una OrganizerVerification.
    /// </summary>
    public VerificationLevel VerificationLevel { get; set; } = VerificationLevel.Unverified;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Event> Events { get; set; } = new List<Event>();

    /// <summary>
    /// Historial de verificaciones KYC.
    /// Un organizador puede tener múltiples intentos (rechazos + reenvíos).
    /// </summary>
    public ICollection<OrganizerVerification> Verifications { get; set; }
        = new List<OrganizerVerification>();
}
