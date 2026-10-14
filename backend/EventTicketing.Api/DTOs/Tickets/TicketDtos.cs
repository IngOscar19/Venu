using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Tickets;

public record PurchaseTicketItemDto(
    Guid EventSectionId,
    string AttendeeName,
    string AttendeeEmail
);

public record CreateOrderDto(
    Guid EventId,
    List<PurchaseTicketItemDto> Items
);

public record TicketDto(
    Guid Id,
    Guid OrderId,
    Guid EventSectionId,
    string SectionName,
    string TicketCode,
    string AttendeeName,
    string AttendeeEmail,
    decimal Price,
    TicketStatus Status,
    DateTime? UsedAt,
    DateTime CreatedAt,
    string EventName,
    DateTime EventStartDate,
    string VenueName
);

public record OrderDto(
    Guid Id,
    string ReferenceCode,
    Guid UserId,
    Guid EventId,
    string EventName,
    decimal TotalAmount,
    OrderStatus Status,
    DateTime CreatedAt,
    List<TicketDto> Tickets
);
