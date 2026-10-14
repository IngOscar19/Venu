using EventTicketing.Api.DTOs.Dashboard;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var isAdmin = User.IsInRole("ADMIN") 
            || User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value == "ADMIN"
            || User.FindFirst("role")?.Value == "ADMIN";

        // ADMIN ve stats globales de toda la plataforma
        if (isAdmin)
        {
            var adminStats = await _dashboardService.GetGlobalStatsAsync();
            return Ok(adminStats);
        }

        // ORGANIZER ve solo sus propios eventos
        var organizerId = GetOrganizerIdFromClaims();
        var stats = await _dashboardService.GetOrganizerStatsAsync(organizerId);
        return Ok(stats);
    }

    private Guid GetOrganizerIdFromClaims()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "organizerId")?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var organizerId))
            throw new UnauthorizedAccessException("El usuario autenticado no cuenta con un perfil de organizador asociado.");
        return organizerId;
    }
}
