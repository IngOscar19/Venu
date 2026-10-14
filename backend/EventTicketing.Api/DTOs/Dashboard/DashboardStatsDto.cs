using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.DTOs.Dashboard;

public record DashboardStatsDto(
    int TotalEvents,
    int PublishedEvents,
    int DraftEvents,
    int CancelledEvents,
    int TotalTicketsSold,
    decimal TotalRevenue,
    List<DashboardRecentEventDto> RecentEvents,
    List<DashboardCategoryStatDto> CategoryStats
);

public record DashboardRecentEventDto(
    Guid Id,
    string Name,
    string? CategoryName,
    EventStatus Status,
    DateTime StartDate,
    string VenueName,
    int Capacity,
    int TicketsSold,
    decimal Revenue
);

public record DashboardCategoryStatDto(
    string CategoryName,
    int EventCount,
    int TicketsSold
);
