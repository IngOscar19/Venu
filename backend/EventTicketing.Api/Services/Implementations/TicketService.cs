using System.Security.Cryptography;
using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Tickets;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;

    public TicketService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto> PurchaseTicketsAsync(Guid userId, CreateOrderDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
        {
            throw new ValidationException("Debes seleccionar al menos un boleto para realizar la compra.");
        }

        var ev = await _context.Events
            .Include(e => e.Sections)
            .FirstOrDefaultAsync(e => e.Id == dto.EventId)
            ?? throw new KeyNotFoundException("El evento seleccionado no existe.");

        if (ev.Status != EventStatus.PUBLISHED)
        {
            throw new ValidationException("El evento no se encuentra disponible para la venta de boletos.");
        }

        var sectionIds = dto.Items.Select(i => i.EventSectionId).Distinct().ToList();
        var sections = ev.Sections.Where(s => sectionIds.Contains(s.Id)).ToDictionary(s => s.Id);

        foreach (var item in dto.Items)
        {
            if (!sections.ContainsKey(item.EventSectionId))
            {
                throw new ValidationException($"La sección {item.EventSectionId} no pertenece al evento.");
            }
            if (string.IsNullOrWhiteSpace(item.AttendeeName))
            {
                throw new ValidationException("El nombre del asistente es requerido.");
            }
            if (string.IsNullOrWhiteSpace(item.AttendeeEmail))
            {
                throw new ValidationException("El correo del asistente es requerido.");
            }
        }

        // Validar disponibilidad de cupos por sección
        foreach (var group in dto.Items.GroupBy(i => i.EventSectionId))
        {
            var sectionId = group.Key;
            var requestedQty = group.Count();
            var section = sections[sectionId];

            var soldQty = await _context.Tickets
                .CountAsync(t => t.EventSectionId == sectionId && t.Status != TicketStatus.CANCELLED);

            if (soldQty + requestedQty > section.Capacity)
            {
                throw new ValidationException($"No hay suficientes boletos disponibles para la sección '{section.Name}'. Disponibles: {section.Capacity - soldQty}.");
            }
        }

        var order = new Order
        {
            UserId = userId,
            EventId = dto.EventId,
            ReferenceCode = GenerateReferenceCode(),
            Status = OrderStatus.COMPLETED,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        decimal total = 0;
        foreach (var item in dto.Items)
        {
            var section = sections[item.EventSectionId];
            total += section.BasePrice;

            var ticket = new Ticket
            {
                OrderId = order.Id,
                EventSectionId = section.Id,
                TicketCode = GenerateTicketCode(),
                AttendeeName = item.AttendeeName.Trim(),
                AttendeeEmail = item.AttendeeEmail.Trim().ToLower(),
                Price = section.BasePrice,
                Status = TicketStatus.VALID,
                CreatedAt = DateTime.UtcNow
            };

            order.Tickets.Add(ticket);
        }

        order.TotalAmount = total;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return await GetOrderByIdAsync(userId, order.Id);
    }

    public async Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId)
    {
        var orders = await _context.Orders
            .Include(o => o.Event)
            .Include(o => o.Tickets)
                .ThenInclude(t => t.EventSection)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToOrderDto);
    }

    public async Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Event)
            .Include(o => o.Tickets)
                .ThenInclude(t => t.EventSection)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("La orden solicitada no existe.");

        if (order.UserId != userId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para ver esta orden.");
        }

        return MapToOrderDto(order);
    }

    public async Task<IEnumerable<TicketDto>> GetUserTicketsAsync(Guid userId)
    {
        var tickets = await _context.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .Where(t => t.Order.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tickets.Select(MapToTicketDto);
    }

    public async Task<TicketDto> GetTicketByIdAsync(Guid userId, Guid ticketId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException("El boleto solicitado no existe.");

        if (ticket.Order.UserId != userId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para ver este boleto.");
        }

        return MapToTicketDto(ticket);
    }

    private static string GenerateReferenceCode()
    {
        var randomNum = RandomNumberGenerator.GetInt32(100000, 999999);
        return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{randomNum}";
    }

    private static string GenerateTicketCode()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(8);
        var hex = Convert.ToHexString(randomBytes);
        return $"TKT-{hex}";
    }

    private static OrderDto MapToOrderDto(Order o)
    {
        return new OrderDto(
            o.Id,
            o.ReferenceCode,
            o.UserId,
            o.EventId,
            o.Event?.Name ?? string.Empty,
            o.TotalAmount,
            o.Status,
            o.CreatedAt,
            o.Tickets.Select(t => new TicketDto(
                t.Id,
                t.OrderId,
                t.EventSectionId,
                t.EventSection?.Name ?? string.Empty,
                t.TicketCode,
                t.AttendeeName,
                t.AttendeeEmail,
                t.Price,
                t.Status,
                t.UsedAt,
                t.CreatedAt,
                o.Event?.Name ?? string.Empty,
                o.Event?.StartDate ?? DateTime.MinValue,
                o.Event?.VenueName ?? string.Empty
            )).ToList()
        );
    }

    private static TicketDto MapToTicketDto(Ticket t)
    {
        return new TicketDto(
            t.Id,
            t.OrderId,
            t.EventSectionId,
            t.EventSection?.Name ?? string.Empty,
            t.TicketCode,
            t.AttendeeName,
            t.AttendeeEmail,
            t.Price,
            t.Status,
            t.UsedAt,
            t.CreatedAt,
            t.Order?.Event?.Name ?? string.Empty,
            t.Order?.Event?.StartDate ?? DateTime.MinValue,
            t.Order?.Event?.VenueName ?? string.Empty
        );
    }
}
