namespace EventTicketing.Api.DTOs.Events;

public record RescheduleEventDto(
    DateTime StartDate,
    DateTime EndDate,
    TimeSpan StartTime,
    TimeSpan EndTime,
    string? Reason = null
);
