using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Access;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class AccessService : IAccessService
{
    private readonly ApplicationDbContext _context;

    public AccessService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TicketValidationResultDto> ValidateAndCheckInAsync(ValidateTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TicketCode))
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "El código de boleto es requerido.",
                TicketCode: null,
                AttendeeName: null,
                SectionName: null,
                EventName: null,
                UsedAt: null
            );
        }

        var normalizedCode = dto.TicketCode.Trim();

        var ticket = await _context.Tickets
            .Include(t => t.EventSection)
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .FirstOrDefaultAsync(t => t.TicketCode == normalizedCode);

        if (ticket == null)
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "Boleto no encontrado o código inválido.",
                TicketCode: normalizedCode,
                AttendeeName: null,
                SectionName: null,
                EventName: null,
                UsedAt: null
            );
        }

        if (dto.EventId.HasValue && ticket.Order.EventId != dto.EventId.Value)
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "Este boleto no corresponde al evento actual.",
                TicketCode: ticket.TicketCode,
                AttendeeName: ticket.AttendeeName,
                SectionName: ticket.EventSection?.Name,
                EventName: ticket.Order?.Event?.Name,
                UsedAt: ticket.UsedAt
            );
        }

        if (ticket.Status == TicketStatus.CANCELLED)
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "El boleto se encuentra CANCELADO.",
                TicketCode: ticket.TicketCode,
                AttendeeName: ticket.AttendeeName,
                SectionName: ticket.EventSection?.Name,
                EventName: ticket.Order?.Event?.Name,
                UsedAt: null
            );
        }

        if (ticket.Status == TicketStatus.USED)
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: $"Boleto YA UTILIZADO previamente el {ticket.UsedAt:dd/MM/yyyy HH:mm:ss} UTC.",
                TicketCode: ticket.TicketCode,
                AttendeeName: ticket.AttendeeName,
                SectionName: ticket.EventSection?.Name,
                EventName: ticket.Order?.Event?.Name,
                UsedAt: ticket.UsedAt
            );
        }

        // Marcar como usado y registrar acceso
        ticket.Status = TicketStatus.USED;
        ticket.UsedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new TicketValidationResultDto(
            Success: true,
            Message: "Acceso AUTORIZADO. ¡Bienvenido!",
            TicketCode: ticket.TicketCode,
            AttendeeName: ticket.AttendeeName,
            SectionName: ticket.EventSection?.Name,
            EventName: ticket.Order?.Event?.Name,
            UsedAt: ticket.UsedAt
        );
    }
}
