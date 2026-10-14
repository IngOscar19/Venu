using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Events;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class EventService : IEventService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly IAuditService _audit;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EventService(
        ApplicationDbContext context,
        IStorageService storageService,
        IAuditService audit,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _storageService = storageService;
        _audit = audit;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<IEnumerable<EventDetailDto>> GetAllAsync(string? search = null, string? city = null, DateTime? fromDate = null, EventStatus? status = null)
    {
        var query = _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.EventType)
            .Include(e => e.Sections)
            .Include(e => e.Images)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(searchLower) || e.Description.ToLower().Contains(searchLower) || e.VenueName.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityLower = city.Trim().ToLower();
            query = query.Where(e => e.City.ToLower() == cityLower);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(e => e.StartDate >= fromDate.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status.Value);
        }

        var events = await query.OrderBy(e => e.StartDate).ToListAsync();
        return events.Select(MapToDetailDto);
    }

    public async Task<IEnumerable<EventDetailDto>> GetOrganizerEventsAsync(Guid organizerId)
    {
        var events = await _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.EventType)
            .Include(e => e.Sections)
            .Include(e => e.Images)
            .Where(e => e.OrganizerId == organizerId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return events.Select(MapToDetailDto);
    }

    public async Task<EventDetailDto> GetByIdAsync(Guid id)
    {
        var e = await _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.EventType)
            .Include(e => e.Sections)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("El evento no existe.");

        return MapToDetailDto(e);
    }

    public async Task<EventDetailDto> CreateAsync(Guid organizerId, CreateEventDto dto)
    {
        if (dto.EventTypeId.HasValue && !await _context.EventTypes.AnyAsync(t => t.Id == dto.EventTypeId.Value))
        {
            throw new ValidationException("El tipo de evento seleccionado no es válido.");
        }

        var ev = new Event
        {
            OrganizerId = organizerId,
            EventTypeId = dto.EventTypeId,
            Name = dto.Name,
            Slug = await GenerateSlugAsync(dto.Name),
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            VenueName = dto.VenueName,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Capacity = dto.Capacity,
            Status = EventStatus.DRAFT,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(ev);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(ev.Id);
    }

    public async Task<EventDetailDto> UpdateAsync(Guid organizerId, Guid eventId, UpdateEventDto dto)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        if (dto.EventTypeId.HasValue && !await _context.EventTypes.AnyAsync(t => t.Id == dto.EventTypeId.Value))
        {
            throw new ValidationException("El tipo de evento seleccionado no es válido.");
        }

        ev.EventTypeId = dto.EventTypeId;
        ev.Name = dto.Name;
        ev.Slug = await GenerateSlugAsync(dto.Name, ev.Id);
        ev.Description = dto.Description;
        ev.StartDate = dto.StartDate;
        ev.EndDate = dto.EndDate;
        ev.StartTime = dto.StartTime;
        ev.EndTime = dto.EndTime;
        ev.VenueName = dto.VenueName;
        ev.Address = dto.Address;
        ev.City = dto.City;
        ev.State = dto.State;
        ev.Latitude = dto.Latitude;
        ev.Longitude = dto.Longitude;
        ev.Capacity = dto.Capacity;
        ev.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(ev.Id);
    }

    public async Task DeleteAsync(Guid organizerId, Guid eventId)
    {
        var ev = await _context.Events
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para eliminar este evento.");
        }

        var hasOrders = await _context.Orders.AnyAsync(o => o.EventId == eventId);
        if (hasOrders)
        {
            throw new ValidationException("No se puede eliminar un evento que ya cuenta con órdenes o ventas asociadas.");
        }

        // Delete physical image files
        foreach (var img in ev.Images)
        {
            await _storageService.DeleteFileAsync(img.Url);
        }

        _context.Events.Remove(ev);
        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            action:      AuditActions.EventDeleted,
            entityType:  "Event",
            entityId:    eventId,
            userId:      GetUserIdFromContext(),
            details:     $"Evento eliminado: {ev.Name}",
            httpContext: _httpContextAccessor.HttpContext);
    }

    public async Task<EventSectionDto> AddSectionAsync(Guid organizerId, Guid eventId, CreateEventSectionDto dto)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        var totalSectionCapacity = ev.Sections.Sum(s => s.Capacity) + dto.Capacity;
        if (totalSectionCapacity > ev.Capacity)
        {
            throw new ValidationException($"La capacidad total de las secciones ({totalSectionCapacity}) no puede superar la capacidad máxima del evento ({ev.Capacity}).");
        }

        var section = new EventSection
        {
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

    public async Task<EventImageDto> AddImageAsync(Guid organizerId, Guid eventId, AddEventImageDto dto)
    {
        var ev = await _context.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        if (dto.Type == ImageType.POSTER)
        {
            var oldPosters = await _context.EventImages
                .Where(i => i.EventId == eventId && i.Type == ImageType.POSTER)
                .ToListAsync();
            foreach (var old in oldPosters)
            {
                await _storageService.DeleteFileAsync(old.Url);
                _context.EventImages.Remove(old);
            }
        }

        var image = new EventImage
        {
            EventId = eventId,
            Url = dto.Url,
            Type = dto.Type,
            Order = dto.Order,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventImages.Add(image);
        await _context.SaveChangesAsync();

        return new EventImageDto(image.Id, image.EventId, image.Url, image.Type, image.Order);
    }

    public async Task<EventImageDto> UploadImageAsync(Guid organizerId, Guid eventId, IFormFile file, ImageType type, int order)
    {
        var ev = await _context.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        if (type == ImageType.POSTER)
        {
            var oldPosters = await _context.EventImages
                .Where(i => i.EventId == eventId && i.Type == ImageType.POSTER)
                .ToListAsync();
            foreach (var old in oldPosters)
            {
                await _storageService.DeleteFileAsync(old.Url);
                _context.EventImages.Remove(old);
            }
        }

        var relativeUrl = await _storageService.SaveFileAsync(file, "events");

        var image = new EventImage
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Url = relativeUrl,
            Type = type,
            Order = order,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventImages.Add(image);
        await _context.SaveChangesAsync();

        return new EventImageDto(image.Id, image.EventId, image.Url, image.Type, image.Order);
    }

    public async Task DeleteImageAsync(Guid organizerId, Guid eventId, Guid imageId)
    {
        var ev = await _context.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("El evento no existe.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para modificar este evento.");
        }

        var img = await _context.EventImages.FirstOrDefaultAsync(i => i.Id == imageId && i.EventId == eventId)
            ?? throw new KeyNotFoundException("La imagen especificada no existe.");

        await _storageService.DeleteFileAsync(img.Url);
        _context.EventImages.Remove(img);
        await _context.SaveChangesAsync();
    }

    public async Task PublishAsync(Guid organizerId, Guid eventId)
    {
        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("El evento no fue encontrado.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para publicar este evento.");
        }

        if (string.IsNullOrWhiteSpace(ev.Name)) 
            throw new ValidationException("El evento requiere un nombre válido.");
            
        if (ev.Capacity <= 0) 
            throw new ValidationException("La capacidad debe ser mayor a cero.");

        if (!ev.Sections.Any())
            throw new ValidationException("El evento debe tener al menos una sección de boletos antes de publicarse.");

        var hasPoster = await _context.EventImages
            .AnyAsync(i => i.EventId == eventId && i.Type == ImageType.POSTER);

        if (!hasPoster)
            throw new ValidationException("El evento debe tener una imagen de portada (POSTER) antes de publicarse.");

        var organizer = await _context.Organizers
            .FirstOrDefaultAsync(o => o.Id == organizerId)
            ?? throw new KeyNotFoundException("Organizador no encontrado.");

        if (organizer.VerificationLevel == VerificationLevel.Unverified)
            throw new ValidationException("Debes verificar tu cuenta antes de publicar eventos.");

        var maxCapacity = organizer.VerificationLevel switch
        {
            VerificationLevel.Basic      => 500,
            VerificationLevel.Pro        => 5000,
            VerificationLevel.Enterprise => int.MaxValue,
            _                            => 0
        };

        if (ev.Capacity > maxCapacity)
            throw new ValidationException($"Tu nivel de verificación permite eventos de hasta {maxCapacity} personas.");

        var activeEvents = await _context.Events
            .CountAsync(e => e.OrganizerId == organizerId && e.Status == EventStatus.PUBLISHED);

        var maxActive = organizer.VerificationLevel switch
        {
            VerificationLevel.Basic      => 3,
            VerificationLevel.Pro        => 10,
            VerificationLevel.Enterprise => int.MaxValue,
            _                            => 0
        };

        if (activeEvents >= maxActive)
            throw new ValidationException($"Has alcanzado el límite de {maxActive} eventos publicados para tu nivel de verificación.");

        ev.Status = EventStatus.PUBLISHED;
        ev.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            action:      AuditActions.EventPublished,
            entityType:  "Event",
            entityId:    eventId,
            userId:      GetUserIdFromContext(),
            details:     $"Evento publicado: {ev.Name}",
            httpContext: _httpContextAccessor.HttpContext);
    }

    public async Task CancelAsync(Guid organizerId, Guid eventId)
    {
        var ev = await _context.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("El evento no fue encontrado.");

        if (ev.OrganizerId != organizerId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para cancelar este evento.");
        }

        ev.Status = EventStatus.CANCELLED;
        ev.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            action:      AuditActions.EventCancelled,
            entityType:  "Event",
            entityId:    eventId,
            userId:      GetUserIdFromContext(),
            details:     $"Evento cancelado: {ev.Name}",
            httpContext: _httpContextAccessor.HttpContext);
    }

    private async Task<string> GenerateSlugAsync(string name, Guid? excludeEventId = null)
    {
        var base_slug = string.Concat(
            name.Trim().ToLower()
                .Normalize(System.Text.NormalizationForm.FormD)
                .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) 
                            != System.Globalization.UnicodeCategory.NonSpacingMark)
        ).Replace(" ", "-");
        
        base_slug = string.Concat(base_slug.Where(c => char.IsLetterOrDigit(c) || c == '-'));

        var slug = base_slug;
        var counter = 1;

        while (await _context.Events.AnyAsync(e => e.Slug == slug && e.Id != (excludeEventId ?? Guid.Empty)))
        {
            slug = $"{base_slug}-{counter++}";
        }

        return slug;
    }

    private static EventDetailDto MapToDetailDto(Event e)
    {
        return new EventDetailDto(
            e.Id,
            e.Name,
            e.Slug,
            e.Description,
            e.Status,
            e.StartDate,
            e.EndDate,
            e.StartTime,
            e.EndTime,
            e.VenueName,
            e.Address,
            e.City,
            e.State,
            e.Latitude,
            e.Longitude,
            e.Capacity,
            e.EventTypeId,
            e.EventType?.Name,
            e.OrganizerId,
            e.Organizer?.Name,
            e.Sections.Select(s => new EventSectionDto(s.Id, s.EventId, s.Name, s.Description, s.Capacity, s.BasePrice)).ToList(),
            e.Images.OrderBy(i => i.Order).Select(i => new EventImageDto(i.Id, i.EventId, i.Url, i.Type, i.Order)).ToList()
        );
    }

    private Guid? GetUserIdFromContext()
    {
        var claim = _httpContextAccessor.HttpContext?
            .User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
