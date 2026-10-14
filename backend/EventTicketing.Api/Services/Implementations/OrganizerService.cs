using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Organizers;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class OrganizerService : IOrganizerService
{
    private readonly ApplicationDbContext _context;

    public OrganizerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SubmitVerificationAsync(Guid organizerId, SubmitVerificationFormDto dto)
    {
        var organizer = await _context.Organizers
            .Include(o => o.Verifications)
            .FirstOrDefaultAsync(o => o.Id == organizerId)
            ?? throw new NotFoundException("Organizador no encontrado.");

        if (organizer.Status == OrganizerStatus.VERIFIED)
            throw new BusinessException("La cuenta ya está verificada.");

        // Guardar archivo (almacenamiento local en wwwroot para Entrega 1)
        string? documentUrl = dto.CompanyDocumentUrl;
        if (dto.CompanyDocument != null && dto.CompanyDocument.Length > 0)
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "kyc");
            Directory.CreateDirectory(uploadsPath);
            var extension = Path.GetExtension(dto.CompanyDocument.FileName);
            var fileName = $"{organizerId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var fullPath = Path.Combine(uploadsPath, fileName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await dto.CompanyDocument.CopyToAsync(stream);
            }
            documentUrl = $"/uploads/kyc/{fileName}";
        }

        var latestVerification = organizer.Verifications
            .OrderByDescending(v => v.SubmittedAt)
            .FirstOrDefault();

        if (latestVerification == null)
        {
            var verification = new OrganizerVerification
            {
                OrganizerId = organizerId,
                LegalName = dto.LegalName,
                TaxId = dto.TaxId,
                ClabeAccount = dto.ClabeAccount,
                CompanyDocumentUrl = documentUrl,
                Status = VerificationStatus.Pending,
                SubmittedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.OrganizerVerifications.Add(verification);
        }
        else
        {
            // Re-submit after rejection
            latestVerification.LegalName = dto.LegalName;
            latestVerification.TaxId = dto.TaxId;
            latestVerification.ClabeAccount = dto.ClabeAccount;
            if (!string.IsNullOrEmpty(documentUrl))
            {
                latestVerification.CompanyDocumentUrl = documentUrl;
            }
            latestVerification.Status = VerificationStatus.Pending;
            latestVerification.SubmittedAt = DateTime.UtcNow;
            latestVerification.UpdatedAt = DateTime.UtcNow;
            latestVerification.RejectionReason = null;
            latestVerification.ReviewNotes = null;
            latestVerification.ReviewedByAdminId = null;
            latestVerification.ReviewedAt = null;
        }

        organizer.Status = OrganizerStatus.PENDING;
        organizer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<OrganizerVerification?> GetMyVerificationAsync(Guid organizerId)
    {
        return await _context.OrganizerVerifications
            .Where(v => v.OrganizerId == organizerId)
            .OrderByDescending(v => v.SubmittedAt)
            .FirstOrDefaultAsync();
    }
}
