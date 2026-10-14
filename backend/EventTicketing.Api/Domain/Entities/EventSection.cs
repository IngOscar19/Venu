namespace EventTicketing.Api.Domain.Entities;

public class EventSection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public decimal BasePrice { get; set; }

    // Auditoría — necesario para reportes en entregas futuras
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;

    // Preparado para entrega 2 — asientos individuales
    // public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}
