namespace EventTicketing.Api.DTOs.Events;

public record EventTypeDto(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive
);
