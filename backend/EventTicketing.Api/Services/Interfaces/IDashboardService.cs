using EventTicketing.Api.DTOs.Dashboard;

namespace EventTicketing.Api.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetOrganizerStatsAsync(Guid organizerId);
    Task<DashboardStatsDto> GetGlobalStatsAsync();
}
