using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizerId { get; set; }

    // Nullable: los eventos en DRAFT pueden no tener tipo aún
    public Guid? EventTypeId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public string VenueName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public int Capacity { get; set; }
    public EventStatus Status { get; set; } = EventStatus.DRAFT;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Organizer Organizer { get; set; } = null!;
    public EventType? EventType { get; set; }
    public ICollection<EventImage> Images { get; set; } = new List<EventImage>();
    public ICollection<EventSection> Sections { get; set; } = new List<EventSection>();
}
