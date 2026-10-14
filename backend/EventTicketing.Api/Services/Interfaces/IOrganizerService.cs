using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.DTOs.Organizers;

namespace EventTicketing.Api.Services.Interfaces;

public interface IOrganizerService
{
    Task SubmitVerificationAsync(Guid organizerId, SubmitVerificationFormDto dto);
    Task<OrganizerVerification?> GetMyVerificationAsync(Guid organizerId);
}
