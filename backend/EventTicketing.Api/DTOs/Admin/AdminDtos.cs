using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Admin;

/// <summary>
/// Vista completa de un organizador para el panel de administración.
/// </summary>
public record OrganizerAdminDto(
    Guid Id,
    string Name,
    string? Description,
    OrganizerStatus Status,
    VerificationLevel VerificationLevel,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    DateTime CreatedAt
);

/// <summary>
/// Payload para cambiar el nivel de verificación de un organizador.
/// </summary>
public record UpdateVerificationLevelDto(
    VerificationLevel VerificationLevel
);

/// <summary>
/// Payload para suspender un organizador con motivo.
/// </summary>
public record SuspendOrganizerDto(
    string Reason
);

/// <summary>
/// Payload para aprobar la verificación de un organizador.
/// </summary>
public class ApproveOrganizerDto
{
    public VerificationLevel Level { get; set; } = VerificationLevel.Basic;
    public string? Notes { get; set; }
}

/// <summary>
/// Payload para rechazar la verificación de un organizador.
/// </summary>
public class RejectOrganizerDto
{
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Detalle de verificación pendiente para el panel de administración.
/// </summary>
public class OrganizerVerificationDetailDto
{
    public Guid OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string? ClabeAccount { get; set; }
    public string? CompanyDocumentUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
}