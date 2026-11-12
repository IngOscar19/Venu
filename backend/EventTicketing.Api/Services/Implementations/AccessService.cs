using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.DTOs.Access;
using EventTicketing.Api.Infrastructure.Qr;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Services.Implementations;

public class AccessService : IAccessService
{
    private readonly ApplicationDbContext _context;
    private readonly IDynamicQrService _dynamicQr;

    public AccessService(ApplicationDbContext context, IDynamicQrService dynamicQr)
    {
        _context = context;
        _dynamicQr = dynamicQr;
    }

    public async Task<TicketValidationResultDto> ValidateAndCheckInAsync(ValidateTicketDto dto, Guid? organizerId = null, bool isAdmin = false)
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

        var rawInput = dto.TicketCode.Trim();
        var ticketCodeToSearch = rawInput;
        var esDinamico = false;
        long ventanaEscaneada = 0;
        var firmaEscaneada = string.Empty;

        if (rawInput.StartsWith("DYN:", StringComparison.OrdinalIgnoreCase))
        {
            var partes = rawInput.Split(':');
            if (partes.Length == 4)
            {
                esDinamico = true;
                ticketCodeToSearch = partes[1];
                long.TryParse(partes[2], out ventanaEscaneada);
                firmaEscaneada = partes[3];
            }
        }

        var ticket = await _context.Tickets
            .Include(t => t.EventSection)
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .FirstOrDefaultAsync(t => t.TicketCode == ticketCodeToSearch);

        if (ticket == null)
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "Boleto no encontrado o código inválido.",
                TicketCode: ticketCodeToSearch,
                AttendeeName: null,
                SectionName: null,
                EventName: null,
                UsedAt: null
            );
        }

        if (esDinamico)
        {
            var ahoraSegundos = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var ventanaActual = ahoraSegundos / DynamicQrService.VentanaSegundos;

            // Tolerancia de ±1 ventana (±20s) por posibles desfases leves del reloj entre cliente y servidor
            if (Math.Abs(ventanaEscaneada - ventanaActual) > 1)
            {
                return new TicketValidationResultDto(
                    Success: false,
                    Message: "Código QR expirado. Muestra el código en vivo desde la aplicación oficial (las capturas de pantalla no son válidas).",
                    TicketCode: ticketCodeToSearch,
                    AttendeeName: ticket.AttendeeName,
                    SectionName: ticket.EventSection?.Name,
                    EventName: ticket.Order?.Event?.Name,
                    UsedAt: null
                );
            }

            var seed = _dynamicQr.GenerarSeed(ticket.Id, ticket.TicketCode);
            if (!_dynamicQr.ValidarFirma(ticket.TicketCode, seed, ventanaEscaneada, firmaEscaneada))
            {
                return new TicketValidationResultDto(
                    Success: false,
                    Message: "Firma dinámica de boleto inválida o adulterada.",
                    TicketCode: ticketCodeToSearch,
                    AttendeeName: null,
                    SectionName: null,
                    EventName: null,
                    UsedAt: null
                );
            }
        }

        // Un organizador solo puede validar boletos de sus propios eventos
        if (!isAdmin && (organizerId is null || ticket.Order?.Event?.OrganizerId != organizerId))
        {
            return new TicketValidationResultDto(
                Success: false,
                Message: "No tienes permiso para validar boletos de este evento.",
                TicketCode: null,
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
