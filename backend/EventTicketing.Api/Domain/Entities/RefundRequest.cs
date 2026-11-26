namespace EventTicketing.Api.Domain.Entities;

public class RefundRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Guid OrderId { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }

    /// <summary>Estado del evento que habilitó la solicitud: "CANCELLED" o "RESCHEDULED".</summary>
    public string EventTriggerStatus { get; set; } = string.Empty;

    /// <summary>Estado de la solicitud/decisión: "PENDING", "REFUNDED", "REJECTED" o "KEPT".</summary>
    public string Status { get; set; } = "PENDING";

    public string? Reason { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public Order Order { get; set; } = null!;
    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
