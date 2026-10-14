using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Dashboard;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetOrganizerStatsAsync(Guid organizerId)
    {
        var events = await _context.Events
            .Include(e => e.EventType)
            .Include(e => e.Sections)
            .Where(e => e.OrganizerId == organizerId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var eventIds = events.Select(e => e.Id).ToList();

        // Get tickets for these events
        var tickets = await _context.Tickets
            .Include(t => t.Order)
            .Where(t => eventIds.Contains(t.Order.EventId) && t.Status != TicketStatus.CANCELLED)
            .ToListAsync();

        var ticketsByEvent = tickets
            .GroupBy(t => t.Order.EventId)
            .ToDictionary(g => g.Key, g => new { Count = g.Count(), Revenue = g.Sum(t => t.Price) });

        var totalEvents = events.Count;
        var publishedEvents = events.Count(e => e.Status == EventStatus.PUBLISHED);
        var draftEvents = events.Count(e => e.Status == EventStatus.DRAFT);
        var cancelledEvents = events.Count(e => e.Status == EventStatus.CANCELLED);
        var totalTicketsSold = tickets.Count;
        var totalRevenue = tickets.Sum(t => t.Price);

        var recentEvents = events.Take(5).Select(e =>
        {
            var stats = ticketsByEvent.TryGetValue(e.Id, out var s) ? s : new { Count = 0, Revenue = 0m };
            return new DashboardRecentEventDto(
                e.Id,
                e.Name,
                e.EventType?.Name,
                e.Status,
                e.StartDate,
                e.VenueName,
                e.Capacity,
                stats.Count,
                stats.Revenue
            );
        }).ToList();

        var categoryStats = events
            .GroupBy(e => e.EventType?.Name ?? "Sin categoría")
            .Select(g =>
            {
                var catEventIds = g.Select(e => e.Id).ToHashSet();
                var catTicketsSold = tickets.Count(t => catEventIds.Contains(t.Order.EventId));
                return new DashboardCategoryStatDto(
                    g.Key,
                    g.Count(),
                    catTicketsSold
                );
            })
            .OrderByDescending(c => c.EventCount)
            .ToList();

        return new DashboardStatsDto(
            totalEvents,
            publishedEvents,
            draftEvents,
            cancelledEvents,
            totalTicketsSold,
            totalRevenue,
            recentEvents,
            categoryStats
        );
    }

    public async Task<DashboardStatsDto> GetGlobalStatsAsync()
    {
        var events = await _context.Events
            .Include(e => e.EventType)
            .Include(e => e.Sections)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var eventIds = events.Select(e => e.Id).ToList();

        var tickets = await _context.Tickets
            .Include(t => t.Order)
            .Where(t => eventIds.Contains(t.Order.EventId) && t.Status != TicketStatus.CANCELLED)
            .ToListAsync();

        var ticketsByEvent = tickets
            .GroupBy(t => t.Order.EventId)
            .ToDictionary(g => g.Key, g => new { Count = g.Count(), Revenue = g.Sum(t => t.Price) });

        var recentEvents = events.Take(5).Select(e =>
        {
            var stats = ticketsByEvent.TryGetValue(e.Id, out var s) ? s : new { Count = 0, Revenue = 0m };
            return new DashboardRecentEventDto(
                e.Id, e.Name, e.EventType?.Name, e.Status,
                e.StartDate, e.VenueName, e.Capacity,
                stats.Count, stats.Revenue
            );
        }).ToList();

        var categoryStats = events
            .GroupBy(e => e.EventType?.Name ?? "Sin categoría")
            .Select(g =>
            {
                var catEventIds = g.Select(e => e.Id).ToHashSet();
                var catTicketsSold = tickets.Count(t => catEventIds.Contains(t.Order.EventId));
                return new DashboardCategoryStatDto(g.Key, g.Count(), catTicketsSold);
            })
            .OrderByDescending(c => c.EventCount)
            .ToList();

        return new DashboardStatsDto(
            events.Count,
            events.Count(e => e.Status == EventStatus.PUBLISHED),
            events.Count(e => e.Status == EventStatus.DRAFT),
            events.Count(e => e.Status == EventStatus.CANCELLED),
            tickets.Count,
            tickets.Sum(t => t.Price),
            recentEvents,
            categoryStats
        );
    }
}
