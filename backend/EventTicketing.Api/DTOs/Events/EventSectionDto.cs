namespace EventTicketing.Api.DTOs.Events;

public record EventSectionDto(
    Guid Id,
    Guid EventId,
    string Name,
    string? Description,
    int Capacity,
    decimal BasePrice
);

public record CreateEventSectionDto(
    string Name,
    string? Description,
    int Capacity,
    decimal BasePrice
);
