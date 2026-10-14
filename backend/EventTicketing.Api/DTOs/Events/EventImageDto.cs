using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Events;

public record EventImageDto(
    Guid Id,
    Guid EventId,
    string Url,
    ImageType Type,
    int Order
);

public record AddEventImageDto(
    string Url,
    ImageType Type,
    int Order
);

public class UploadEventImageRequest
{
    public IFormFile File { get; set; } = null!;
    public ImageType Type { get; set; } = ImageType.POSTER;
    public int Order { get; set; } = 0;
}

