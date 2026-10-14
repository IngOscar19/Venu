using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Events;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ISectionService _sectionService;

    public EventsController(IEventService eventService, ISectionService sectionService)
    {
        _eventService = eventService;
        _sectionService = sectionService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<EventDetailDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? city,
        [FromQuery] DateTime? fromDate,
        [FromQuery] EventStatus? status)
    {
        var result = await _eventService.GetAllAsync(search, city, fromDate, status);
        return Ok(result);
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<EventDetailDto>>> GetMyEvents()
    {
        var isAdmin = User.IsInRole("ADMIN")
            || User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value == "ADMIN"
            || User.FindFirst("role")?.Value == "ADMIN";

        if (isAdmin)
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "organizerId")?.Value;
            if (Guid.TryParse(claim, out var orgId))
            {
                var orgEvents = await _eventService.GetOrganizerEventsAsync(orgId);
                return Ok(orgEvents);
            }
            var allEvents = await _eventService.GetAllAsync(null, null, null, null);
            return Ok(allEvents);
        }

        var organizerId = GetOrganizerIdFromClaims();
        var result = await _eventService.GetOrganizerEventsAsync(organizerId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<EventDetailDto>> GetById(Guid id)
    {
        return Ok(await _eventService.GetByIdAsync(id));
    }

    [HttpPost]
    [Authorize]
    [EnableRateLimiting("events")]
    public async Task<ActionResult<EventDetailDto>> Create([FromBody] CreateEventDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _eventService.CreateAsync(organizerId, dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> Update(Guid id, [FromBody] UpdateEventDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _eventService.UpdateAsync(organizerId, id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _eventService.DeleteAsync(organizerId, id);
        return NoContent();
    }

    [HttpPost("{id:guid}/sections")]
    [Authorize]
    public async Task<ActionResult<EventSectionDto>> AddSection(Guid id, [FromBody] CreateEventSectionDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _sectionService.CreateSectionAsync(organizerId, id, dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}/sections/{sectionId:guid}")]
    [Authorize]
    public async Task<ActionResult<EventSectionDto>> UpdateSection(Guid id, Guid sectionId, [FromBody] CreateEventSectionDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _sectionService.UpdateSectionAsync(organizerId, id, sectionId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/sections/{sectionId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteSection(Guid id, Guid sectionId)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _sectionService.DeleteSectionAsync(organizerId, id, sectionId);
        return NoContent();
    }

    [HttpPost("{id:guid}/images")]
    [Authorize]
    public async Task<ActionResult<EventImageDto>> AddImage(Guid id, [FromBody] AddEventImageDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _eventService.AddImageAsync(organizerId, id, dto);
        return Ok(result);
    }

    [HttpPost("{id:guid}/images/upload")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<EventImageDto>> UploadImage(
        Guid id,
        [FromForm] UploadEventImageRequest form)
    {
        var organizerId = GetOrganizerIdFromClaims();
        var result = await _eventService.UploadImageAsync(organizerId, id, form.File, form.Type, form.Order);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _eventService.DeleteImageAsync(organizerId, id, imageId);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<IActionResult> Publish(Guid id)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _eventService.PublishAsync(organizerId, id);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _eventService.CancelAsync(organizerId, id);
        return NoContent();
    }

    private Guid GetOrganizerIdFromClaims()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "organizerId")?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var organizerId))
        {
            throw new UnauthorizedAccessException("El usuario autenticado no cuenta con un perfil de organizador asociado.");
        }
        return organizerId;
    }
}
