using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid EventSectionId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public string AttendeeName { get; set; } = string.Empty;
    public string AttendeeEmail { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.VALID;
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public EventSection EventSection { get; set; } = null!;
}
