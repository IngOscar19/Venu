namespace EventTicketing.Api.DTOs.Access;

public record ValidateTicketDto(
    string TicketCode,
    Guid? EventId
);

public record TicketValidationResultDto(
    bool Success,
    string Message,
    string? TicketCode,
    string? AttendeeName,
    string? SectionName,
    string? EventName,
    DateTime? UsedAt
);
