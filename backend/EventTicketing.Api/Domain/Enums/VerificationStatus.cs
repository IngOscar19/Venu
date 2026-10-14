namespace EventTicketing.Api.Domain.Enums;

public enum VerificationStatus
{
    /// <summary>
    /// Documentos enviados, pendientes de revisión por el equipo de Venú.
    /// </summary>
    Pending,

    /// <summary>
    /// En proceso de revisión manual por un administrador.
    /// </summary>
    UnderReview,

    /// <summary>
    /// Verificación aprobada. El organizador puede publicar eventos.
    /// </summary>
    Approved,

    /// <summary>
    /// Documentos rechazados. Se incluye motivo en ReviewNotes.
    /// </summary>
    Rejected,

    /// <summary>
    /// Cuenta suspendida por comportamiento sospechoso o fraude confirmado.
    /// </summary>
    Suspended
}
