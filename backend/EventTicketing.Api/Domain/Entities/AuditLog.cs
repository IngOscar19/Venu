namespace EventTicketing.Api.Domain.Entities;

/// <summary>
/// Registro inmutable de acciones críticas del sistema.
/// Nunca se edita ni se borra — solo se inserta.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Usuario que ejecutó la acción (null = sistema automático)</summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Acción ejecutada. Usar constantes de AuditActions.
    /// Ejemplos: "EVENT_PUBLISHED", "EVENT_CANCELLED", "ORGANIZER_SUSPENDED"
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Tipo de entidad afectada: "Event", "Order", "Organizer", "Ticket"</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>ID de la entidad afectada</summary>
    public Guid EntityId { get; set; }

    /// <summary>IP desde donde se ejecutó la acción</summary>
    public string? IpAddress { get; set; }

    /// <summary>User-Agent del cliente</summary>
    public string? UserAgent { get; set; }

    /// <summary>Contexto adicional en JSON (valores anteriores/nuevos, motivos, etc.)</summary>
    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

/// <summary>
/// Constantes de acciones para evitar strings hardcodeados en el código.
/// </summary>
public static class AuditActions
{
    // Eventos
    public const string EventCreated   = "EVENT_CREATED";
    public const string EventUpdated   = "EVENT_UPDATED";
    public const string EventPublished = "EVENT_PUBLISHED";
    public const string EventCancelled = "EVENT_CANCELLED";
    public const string EventFinished  = "EVENT_FINISHED";
    public const string EventDeleted   = "EVENT_DELETED";

    // Organizadores
    public const string OrganizerVerificationSubmitted = "ORGANIZER_VERIFICATION_SUBMITTED";
    public const string OrganizerVerificationApproved  = "ORGANIZER_VERIFICATION_APPROVED";
    public const string OrganizerVerificationRejected  = "ORGANIZER_VERIFICATION_REJECTED";
    public const string OrganizerSuspended             = "ORGANIZER_SUSPENDED";

    // Auth
    public const string UserLogin          = "USER_LOGIN";
    public const string UserLoginFailed    = "USER_LOGIN_FAILED";
    public const string UserPasswordChanged = "USER_PASSWORD_CHANGED";

    // Tickets (entrega 2)
    public const string OrderCreated   = "ORDER_CREATED";
    public const string OrderCancelled = "ORDER_CANCELLED";
    public const string TicketUsed     = "TICKET_USED";
    public const string TicketInvalid  = "TICKET_INVALID";
}
