using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class EventImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public string Url { get; set; } = string.Empty;
    public ImageType Type { get; set; } = ImageType.GALLERY;
    public int Order { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;
}
