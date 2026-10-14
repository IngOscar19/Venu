using EventTicketing.Api.Data;
using EventTicketing.Api.DTOs.Events;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/event-types")]
public class EventTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EventTypesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<EventTypeDto>>> GetAll()
    {
        var types = await _context.EventTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new EventTypeDto(t.Id, t.Name, t.Slug, t.IsActive))
            .ToListAsync();

        return Ok(types);
    }
}
