using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.DTOs.Events;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class SectionService : ISectionService
{
    private readonly ApplicationDbContext _context;

    public SectionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EventSectionDto>> GetSectionsByEventIdAsync(Guid eventId)
    {
        var sections = await _context.EventSections
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.BasePrice)
            .ToListAsync();

        return sections.Select(s => new EventSectionDto(
            s.Id,
            s.EventId,
            s.Name,
            s.Description,
            s.Capacity,
            s.BasePrice
        ));
    }

    public async Task<EventSectionDto> CreateSectionAsync(Guid organizerId, Guid eventId, CreateEventSectionDto dto)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento especificado no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para agregar secciones a este evento.");
        }

        var totalSectionCapacity = ev.Sections.Sum(s => s.Capacity) + dto.Capacity;
        if (totalSectionCapacity > ev.Capacity)
        {
            throw new ValidationException($"La capacidad acumulada de las secciones ({totalSectionCapacity}) supera el aforo total del evento ({ev.Capacity}).");
        }

        var section = new EventSection
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Name = dto.Name,
            Description = dto.Description,
            Capacity = dto.Capacity,
            BasePrice = dto.BasePrice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventSections.Add(section);
        await _context.SaveChangesAsync();

        return new EventSectionDto(
            section.Id,
            section.EventId,
            section.Name,
            section.Description,
            section.Capacity,
            section.BasePrice
        );
    }

    public async Task<EventSectionDto> UpdateSectionAsync(Guid organizerId, Guid eventId, Guid sectionId, CreateEventSectionDto dto)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento especificado no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        var section = ev.Sections.FirstOrDefault(s => s.Id == sectionId)
            ?? throw new KeyNotFoundException("La sección no existe en este evento.");

        var otherSectionsCapacity = ev.Sections.Where(s => s.Id != sectionId).Sum(s => s.Capacity);
        if (otherSectionsCapacity + dto.Capacity > ev.Capacity)
        {
            throw new ValidationException($"La nueva capacidad supera el aforo máximo del evento ({ev.Capacity}).");
        }

        section.Name = dto.Name;
        section.Description = dto.Description;
        section.Capacity = dto.Capacity;
        section.BasePrice = dto.BasePrice;
        section.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new EventSectionDto(
            section.Id,
            section.EventId,
            section.Name,
            section.Description,
            section.Capacity,
            section.BasePrice
        );
    }

    public async Task DeleteSectionAsync(Guid organizerId, Guid eventId, Guid sectionId)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento especificado no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        var section = ev.Sections.FirstOrDefault(s => s.Id == sectionId)
            ?? throw new KeyNotFoundException("La sección no existe.");

        var hasTickets = await _context.Tickets.AnyAsync(t => t.EventSectionId == sectionId);
        if (hasTickets)
        {
            throw new ValidationException("No se puede eliminar la sección porque ya cuenta con boletos emitidos o vendidos.");
        }

        _context.EventSections.Remove(section);
        await _context.SaveChangesAsync();
    }
}
