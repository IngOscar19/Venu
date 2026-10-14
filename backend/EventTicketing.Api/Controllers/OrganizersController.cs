using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Organizers;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizersController : ControllerBase
{
    private readonly IOrganizerService _organizerService;
    private readonly ApplicationDbContext _context;

    public OrganizersController(IOrganizerService organizerService, ApplicationDbContext context)
    {
        _organizerService = organizerService;
        _context = context;
    }

    [HttpPost("me/verification")]
    [Authorize(Roles = "ORGANIZER")]
    public async Task<IActionResult> SubmitVerification([FromForm] SubmitVerificationFormDto dto)
    {
        var organizerId = GetOrganizerIdFromClaims();
        await _organizerService.SubmitVerificationAsync(organizerId, dto);
        return Ok(new { message = "Solicitud enviada correctamente." });
    }

    [HttpGet("me/verification")]
    [Authorize(Roles = "ORGANIZER")]
    public async Task<IActionResult> GetMyVerification()
    {
        var organizerId = GetOrganizerIdFromClaims();
        var verification = await _organizerService.GetMyVerificationAsync(organizerId);
        var organizer = await _context.Organizers.FindAsync(organizerId);

        string status;
        if (organizer?.Status == OrganizerStatus.VERIFIED)
        {
            status = "VERIFIED";
        }
        else if (organizer?.Status == OrganizerStatus.REJECTED)
        {
            status = "REJECTED";
        }
        else if (organizer?.Status == OrganizerStatus.SUSPENDED)
        {
            status = "SUSPENDED";
        }
        else // PENDING
        {
            // Si el organizador aún no ha enviado una solicitud de verificación con documentos, es UNVERIFIED
            status = verification != null ? "PENDING" : "UNVERIFIED";
        }

        return Ok(new
        {
            status,
            verificationLevel = organizer?.VerificationLevel.ToString() ?? "Unverified",
            verification = verification != null ? new
            {
                verification.LegalName,
                verification.TaxId,
                verification.ClabeAccount,
                verification.CompanyDocumentUrl,
                verification.SubmittedAt,
                verification.RejectionReason,
                verification.ReviewNotes
            } : null
        });
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
