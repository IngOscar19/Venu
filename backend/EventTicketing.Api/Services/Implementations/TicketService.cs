using EventTicketing.Api.Application.Boletos;
using EventTicketing.Api.Common.Helpers;
using System.Security.Cryptography;
using EventTicketing.Api.Common.Exceptions;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Tickets;
using EventTicketing.Api.Infrastructure.Qr;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;
    private readonly IGeneradorQr _generadorQr;
    private readonly GenerarBoletosService _generarBoletos;
    private readonly IDynamicQrService _dynamicQr;

    public TicketService(
        ApplicationDbContext context,
        IGeneradorQr generadorQr,
        GenerarBoletosService generarBoletos,
        IDynamicQrService dynamicQr)
    {
        _context = context;
        _generadorQr = generadorQr;
        _generarBoletos = generarBoletos;
        _dynamicQr = dynamicQr;
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

        if (ev.Status != EventStatus.PUBLISHED && ev.Status != EventStatus.RESCHEDULED)
        {
            throw new ValidationException("El evento no se encuentra disponible para la venta de boletos.");
        }

        if (EventSchedule.HasEnded(ev))
        {
            throw new ValidationException("Este evento ya finalizó.");
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
            .Where(o => o.UsuarioId == userId)
            .OrderByDescending(o => o.Fecha)
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

        if (order.UsuarioId != userId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para ver esta orden.");
        }

        return MapToOrderDto(order);
    }

    public async Task<IEnumerable<TicketDto>> GetUserTicketsAsync(Guid userId)
    {
        // Auto-recuperación: emite los boletos para órdenes que ya fueron pagadas
        var ordenesPendientesDeEmision = await _context.Orders
            .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
            .Include(o => o.Tickets)
            .Include(o => o.Pago)
            .Where(o => o.UsuarioId == userId && (o.Estado == EstadoOrden.Pagada || o.Pago != null) && o.Tickets.Count == 0)
            .ToListAsync();

        if (ordenesPendientesDeEmision.Count > 0)
        {
            foreach (var ord in ordenesPendientesDeEmision)
            {
                ord.Estado = EstadoOrden.Pagada;
                await _generarBoletos.GenerarDesdeOrdenAsync(ord);
            }
            await _context.SaveChangesAsync();
        }

        var tickets = await _context.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .Where(t => t.Order.UsuarioId == userId)
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

        if (ticket.Order.UsuarioId != userId)
        {
            throw new UnauthorizedAccessException("No tienes permisos para ver este boleto.");
        }

        var png = _generadorQr.GenerarPng(ticket.TicketCode);
        var qrBase64 = Convert.ToBase64String(png);

        return MapToTicketDto(ticket, qrBase64);
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

    private OrderDto MapToOrderDto(Order o)
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
                o.Event?.VenueName ?? string.Empty,
                null,
                _dynamicQr.GenerarSeed(t.Id, t.TicketCode)
            )).ToList()
        );
    }

    private TicketDto MapToTicketDto(Ticket t) => MapToTicketDto(t, null);

    private TicketDto MapToTicketDto(Ticket t, string? qrBase64)
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
            t.Order?.Event?.VenueName ?? string.Empty,
            qrBase64,
            _dynamicQr.GenerarSeed(t.Id, t.TicketCode)
        );
    }
}
