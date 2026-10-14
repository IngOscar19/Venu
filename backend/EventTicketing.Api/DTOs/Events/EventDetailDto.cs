using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Events;

public record EventDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    EventStatus Status,
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
    int Capacity,
    Guid? EventTypeId,
    string? EventTypeName,
    Guid OrganizerId,
    string? OrganizerName,
    List<EventSectionDto> Sections,
    List<EventImageDto> Images
);
