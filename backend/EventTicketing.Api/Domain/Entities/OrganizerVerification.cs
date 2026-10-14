using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

/// <summary>
/// Registro KYC del organizador.
/// La tabla existe desde la entrega 1 para evitar migraciones disruptivas
/// cuando se implemente el flujo de revisión en la entrega 2.
/// </summary>
public class OrganizerVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizerId { get; set; }

    // ── Nivel y estado ──────────────────────────────────────────────
    public VerificationLevel Level { get; set; } = VerificationLevel.Unverified;
    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

    // ── Datos fiscales ───────────────────────────────────────────────
    /// <summary>RFC (persona moral) o CURP (persona física)</summary>
    public string? TaxId { get; set; }

    /// <summary>true = validado contra API del SAT</summary>
    public bool TaxIdValidated { get; set; } = false;

    /// <summary>Nombre legal completo o razón social</summary>
    public string? LegalName { get; set; }

    // ── Documentos (URLs en storage) ─────────────────────────────────
    /// <summary>INE, pasaporte o cédula profesional</summary>
    public string? IdDocumentUrl { get; set; }

    /// <summary>Foto sosteniendo la ID + fecha escrita en papel</summary>
    public string? SelfieWithIdUrl { get; set; }

    /// <summary>Acta constitutiva (solo persona moral)</summary>
    public string? CompanyDocumentUrl { get; set; }

    /// <summary>Poder notarial del representante legal (persona moral)</summary>
    public string? LegalRepresentativeDocumentUrl { get; set; }

    // ── Datos bancarios ──────────────────────────────────────────────
    /// <summary>CLABE interbancaria de 18 dígitos</summary>
    public string? ClabeAccount { get; set; }

    /// <summary>true = verificada con depósito de $1 MXN</summary>
    public bool ClabeVerified { get; set; } = false;

    /// <summary>Nombre del banco correspondiente a la CLABE</summary>
    public string? BankName { get; set; }

    // ── Revisión por administrador ───────────────────────────────────
    /// <summary>Notas internas del administrador que revisó</summary>
    public string? ReviewNotes { get; set; }

    /// <summary>Motivo de rechazo visible para el organizador</summary>
    public string? RejectionReason { get; set; }

    /// <summary>Admin que aprobó o rechazó</summary>
    public Guid? ReviewedByAdminId { get; set; }

    public DateTime? ReviewedAt { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation properties ────────────────────────────────────────
    public Organizer Organizer { get; set; } = null!;
    public User? ReviewedByAdmin { get; set; }
}
