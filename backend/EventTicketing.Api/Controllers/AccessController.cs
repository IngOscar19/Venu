using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.DTOs.Access;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccessController : ControllerBase
{
    private readonly IAccessService _accessService;

    public AccessController(IAccessService accessService)
    {
        _accessService = accessService;
    }

    [HttpPost("check-in")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<ActionResult<TicketValidationResultDto>> CheckIn([FromBody] ValidateTicketDto dto)
    {
        var result = await _accessService.ValidateAndCheckInAsync(dto, User.GetOrganizerId(), User.IsAdminUser());
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
