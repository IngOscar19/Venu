using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Events;
using Microsoft.AspNetCore.Http;

namespace EventTicketing.Api.Services.Interfaces;

public interface IEventService
{
    Task<IEnumerable<EventDetailDto>> GetAllAsync(string? search = null, string? city = null, DateTime? fromDate = null, EventStatus? status = null);
    Task<IEnumerable<EventDetailDto>> GetOrganizerEventsAsync(Guid organizerId);
    Task<EventDetailDto> GetByIdAsync(Guid id);
    Task<EventDetailDto> CreateAsync(Guid organizerId, CreateEventDto dto);
    Task<EventDetailDto> UpdateAsync(Guid organizerId, Guid eventId, UpdateEventDto dto);
    Task DeleteAsync(Guid organizerId, Guid eventId);
    Task<EventSectionDto> AddSectionAsync(Guid organizerId, Guid eventId, CreateEventSectionDto dto);
    Task<EventImageDto> AddImageAsync(Guid organizerId, Guid eventId, AddEventImageDto dto);
    Task<EventImageDto> UploadImageAsync(Guid organizerId, Guid eventId, IFormFile file, ImageType type, int order);
    Task DeleteImageAsync(Guid organizerId, Guid eventId, Guid imageId);
    Task PublishAsync(Guid organizerId, Guid eventId);
    Task CancelAsync(Guid organizerId, Guid eventId);
}
