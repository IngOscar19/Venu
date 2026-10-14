namespace EventTicketing.Api.DTOs.Events;

public record CreateEventDto(
    string Name,
    string Description,
    Guid? EventTypeId,
    DateTime StartDate,
    DateTime EndDate,
    TimeSpan StartTime,
    TimeSpan EndTime,
    string VenueName,
    string Address,
    string City,
    string State,
    double? Latitude,
    double? Longitude,
    int Capacity
);
