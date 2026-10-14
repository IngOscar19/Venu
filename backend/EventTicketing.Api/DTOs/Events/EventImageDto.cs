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
