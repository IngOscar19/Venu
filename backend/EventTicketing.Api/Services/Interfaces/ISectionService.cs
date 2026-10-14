using EventTicketing.Api.DTOs.Events;

namespace EventTicketing.Api.Services.Interfaces;

public interface ISectionService
{
    Task<EventSectionDto> CreateSectionAsync(Guid organizerId, Guid eventId, CreateEventSectionDto dto);
    Task<EventSectionDto> UpdateSectionAsync(Guid organizerId, Guid eventId, Guid sectionId, CreateEventSectionDto dto);
    Task DeleteSectionAsync(Guid organizerId, Guid eventId, Guid sectionId);
    Task<IEnumerable<EventSectionDto>> GetSectionsByEventIdAsync(Guid eventId);
}
