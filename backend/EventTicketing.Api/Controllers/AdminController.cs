using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lista todos los organizadores con su nivel de verificación actual.
    /// </summary>
    [HttpGet("organizers")]
    public async Task<ActionResult<IEnumerable<OrganizerAdminDto>>> GetOrganizers(
        [FromQuery] string? search,
        [FromQuery] OrganizerStatus? status,
        [FromQuery] VerificationLevel? level)
    {
        var query = _context.Organizers
            .Include(o => o.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(o =>
                o.Name.ToLower().Contains(s) ||
                o.User.Email.ToLower().Contains(s));
        }

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (level.HasValue)
            query = query.Where(o => o.VerificationLevel == level.Value);

        var organizers = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrganizerAdminDto(
                o.Id,
                o.Name,
                o.Description,
                o.Status,
                o.VerificationLevel,
                o.User.Id,
                o.User.Email,
                o.User.FirstName,
                o.User.LastName,
                o.CreatedAt
            ))
            .ToListAsync();

        return Ok(organizers);
    }

    /// <summary>
    /// Obtiene el detalle de un organizador específico.
    /// </summary>
    [HttpGet("organizers/{id:guid}")]
    public async Task<ActionResult<OrganizerAdminDto>> GetOrganizer(Guid id)
    {
        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException("Organizador no encontrado.");

        return Ok(new OrganizerAdminDto(
            organizer.Id,
            organizer.Name,
            organizer.Description,
            organizer.Status,
            organizer.VerificationLevel,
            organizer.User.Id,
            organizer.User.Email,
            organizer.User.FirstName,
            organizer.User.LastName,
            organizer.CreatedAt
        ));
    }

    /// <summary>
    /// Cambia el nivel de verificación de un organizador.
    /// Este es el mecanismo manual mientras no existe el flujo KYC automático.
    /// </summary>
    [HttpPut("organizers/{id:guid}/verification-level")]
    public async Task<ActionResult<OrganizerAdminDto>> UpdateVerificationLevel(
        Guid id,
        [FromBody] UpdateVerificationLevelDto dto)
    {
        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException("Organizador no encontrado.");

        organizer.VerificationLevel = dto.VerificationLevel;

        // Al verificar también actualizamos el status del organizador
        organizer.Status = dto.VerificationLevel switch
        {
            VerificationLevel.Unverified => OrganizerStatus.PENDING,
            VerificationLevel.Basic      => OrganizerStatus.VERIFIED,
            VerificationLevel.Pro        => OrganizerStatus.VERIFIED,
            VerificationLevel.Enterprise => OrganizerStatus.VERIFIED,
            _                            => organizer.Status
        };

        organizer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new OrganizerAdminDto(
            organizer.Id,
            organizer.Name,
            organizer.Description,
            organizer.Status,
            organizer.VerificationLevel,
            organizer.User.Id,
            organizer.User.Email,
            organizer.User.FirstName,
            organizer.User.LastName,
            organizer.CreatedAt
        ));
    }

    /// <summary>
    /// Suspende la cuenta de un organizador.
    /// </summary>
    [HttpPost("organizers/{id:guid}/suspend")]
    public async Task<IActionResult> SuspendOrganizer(
        Guid id,
        [FromBody] SuspendOrganizerDto dto)
    {
        var organizer = await _context.Organizers
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException("Organizador no encontrado.");

        if (organizer.Status == OrganizerStatus.SUSPENDED)
            throw new ValidationException("Este organizador ya se encuentra suspendido.");

        organizer.Status = OrganizerStatus.SUSPENDED;
        organizer.VerificationLevel = VerificationLevel.Unverified;
        organizer.UpdatedAt = DateTime.UtcNow;

        // Cancelar todos sus eventos publicados
        var activeEvents = await _context.Events
            .Where(e => e.OrganizerId == id && e.Status == EventStatus.PUBLISHED)
            .ToListAsync();

        foreach (var ev in activeEvents)
        {
            ev.Status = EventStatus.CANCELLED;
            ev.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Organizador suspendido. {activeEvents.Count} evento(s) cancelado(s).",
            eventsCancelled = activeEvents.Count
        });
    }

    /// <summary>
    /// Obtiene las solicitudes de verificación pendientes de organizadores.
    /// </summary>
    [HttpGet("organizers/pending-verifications")]
    public async Task<ActionResult<List<OrganizerVerificationDetailDto>>> GetPendingVerifications()
    {
        var result = await _context.Organizers
            .Include(o => o.Verifications)
            .Include(o => o.User)
            .Where(o => o.Status == OrganizerStatus.PENDING && o.Verifications.Any())
            .Select(o => new OrganizerVerificationDetailDto
            {
                OrganizerId = o.Id,
                OrganizerName = o.Name,
                Email = o.User.Email,
                LegalName = o.Verifications.OrderByDescending(v => v.SubmittedAt).First().LegalName ?? string.Empty,
                TaxId = o.Verifications.OrderByDescending(v => v.SubmittedAt).First().TaxId ?? string.Empty,
                ClabeAccount = o.Verifications.OrderByDescending(v => v.SubmittedAt).First().ClabeAccount,
                CompanyDocumentUrl = o.Verifications.OrderByDescending(v => v.SubmittedAt).First().CompanyDocumentUrl,
                SubmittedAt = o.Verifications.OrderByDescending(v => v.SubmittedAt).First().SubmittedAt
            })
            .OrderBy(o => o.SubmittedAt)
            .ToListAsync();

        return Ok(result);
    }

    /// <summary>
    /// Aprueba la verificación de un organizador.
    /// </summary>
    [HttpPost("organizers/{id:guid}/approve")]
    public async Task<IActionResult> ApproveOrganizer(Guid id, [FromBody] ApproveOrganizerDto dto)
    {
        var adminClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var adminId = Guid.TryParse(adminClaim, out var parsedAdminId) ? parsedAdminId : (Guid?)null;

        var organizer = await _context.Organizers
            .Include(o => o.Verifications)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundException("Organizador no encontrado.");

        organizer.Status = OrganizerStatus.VERIFIED;
        organizer.VerificationLevel = dto.Level;
        organizer.UpdatedAt = DateTime.UtcNow;

        var verification = organizer.Verifications
            .OrderByDescending(v => v.SubmittedAt)
            .FirstOrDefault();

        if (verification != null)
        {
            verification.Status = VerificationStatus.Approved;
            verification.Level = dto.Level;
            verification.ReviewedByAdminId = adminId;
            verification.ReviewNotes = dto.Notes;
            verification.ReviewedAt = DateTime.UtcNow;
            verification.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Organizador verificado." });
    }

    /// <summary>
    /// Rechaza la verificación de un organizador con motivo.
    /// </summary>
    [HttpPost("organizers/{id:guid}/reject")]
    public async Task<IActionResult> RejectOrganizer(Guid id, [FromBody] RejectOrganizerDto dto)
    {
        var adminClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var adminId = Guid.TryParse(adminClaim, out var parsedAdminId) ? parsedAdminId : (Guid?)null;

        var organizer = await _context.Organizers
            .Include(o => o.Verifications)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new NotFoundException("Organizador no encontrado.");

        organizer.Status = OrganizerStatus.REJECTED;
        organizer.UpdatedAt = DateTime.UtcNow;

        var verification = organizer.Verifications
            .OrderByDescending(v => v.SubmittedAt)
            .FirstOrDefault();

        if (verification != null)
        {
            verification.Status = VerificationStatus.Rejected;
            verification.RejectionReason = dto.Reason;
            verification.ReviewedByAdminId = adminId;
            verification.ReviewedAt = DateTime.UtcNow;
            verification.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Solicitud rechazada." });
    }
}
