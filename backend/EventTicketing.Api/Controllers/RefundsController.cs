using EventTicketing.Api.Application.Pagos;
using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/refunds")]
[Authorize]
public class RefundsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IProcesadorPago _procesadorPago;
    private readonly IAuditService _audit;
    private readonly ILogger<RefundsController> _logger;

    public RefundsController(
        ApplicationDbContext db,
        IProcesadorPago procesadorPago,
        IAuditService audit,
        ILogger<RefundsController> logger)
    {
        _db = db;
        _procesadorPago = procesadorPago;
        _audit = audit;
        _logger = logger;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ENDPOINTS PARA COMPRADORES (FLUTTER / CLIENTE FINAL)
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// El comprador solicita el reembolso de su boleto cuando el evento fue CANCELADO o REPROGRAMADO.
    /// </summary>
    [HttpPost("tickets/{ticketId:guid}/request")]
    public async Task<IActionResult> RequestRefund(Guid ticketId, [FromBody] RequestRefundDto? dto)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var ticket = await _db.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket is null || ticket.Order.UsuarioId != userId.Value)
            return NotFound(new { message = "Boleto no encontrado." });

        if (ticket.Status == TicketStatus.USED)
            return BadRequest(new { message = "No se puede solicitar reembolso de un boleto que ya fue utilizado." });

        var ev = ticket.Order.Event;
        if (ev is null || (ev.Status != EventStatus.CANCELLED && ev.Status != EventStatus.RESCHEDULED))
        {
            return BadRequest(new
            {
                message = "Solo se puede solicitar reembolso cuando el evento ha sido reprogramado o cancelado."
            });
        }

        var existing = await _db.RefundRequests
            .Where(r => r.TicketId == ticket.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            if (existing.Status == "REFUNDED")
                return BadRequest(new { message = "Este boleto ya fue reembolsado." });
            if (existing.Status == "PENDING")
                return Ok(new
                {
                    exito = true,
                    message = "Tu solicitud de reembolso ya se encuentra registrada y en revisión.",
                    refundId = existing.Id,
                    refundStatus = existing.Status
                });

            // Si previamente eligió KEPT o fue REJECTED y ahora solicita reembolso:
            existing.Status = "PENDING";
            existing.EventTriggerStatus = ev.Status.ToString();
            existing.Reason = string.IsNullOrWhiteSpace(dto?.Reason)
                ? (ev.Status == EventStatus.CANCELLED ? "Evento cancelado" : "No puedo asistir en la nueva fecha reprogramada")
                : dto!.Reason!.Trim();
            existing.ResolutionNotes = null;
            existing.CreatedAt = DateTime.UtcNow;
            existing.ResolvedAt = null;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                exito = true,
                message = "Solicitud de reembolso enviada correctamente.",
                refundId = existing.Id,
                refundStatus = existing.Status
            });
        }

        var refund = new RefundRequest
        {
            TicketId = ticket.Id,
            OrderId = ticket.OrderId,
            EventId = ev.Id,
            UserId = userId.Value,
            Amount = ticket.Price,
            EventTriggerStatus = ev.Status.ToString(),
            Status = "PENDING",
            Reason = string.IsNullOrWhiteSpace(dto?.Reason)
                ? (ev.Status == EventStatus.CANCELLED ? "Evento cancelado" : "Solicitud por reprogramación de fecha")
                : dto!.Reason!.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefundRequests.Add(refund);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            action: "REFUND_REQUESTED",
            entityType: "Ticket",
            entityId: ticket.Id,
            userId: userId,
            details: $"Reembolso solicitado para boleto {ticket.TicketCode} ({ev.Name}) por ${ticket.Price:0.00}",
            httpContext: HttpContext);

        return Ok(new
        {
            exito = true,
            message = "Tu solicitud de reembolso fue registrada con éxito. El organizador procesará la devolución de tu dinero.",
            refundId = refund.Id,
            refundStatus = refund.Status
        });
    }

    /// <summary>
    /// Cuando un evento es REPROGRAMADO, el comprador puede confirmar explícitamente que desea
    /// MANTENER su boleto válido para la nueva fecha (o revertir una solicitud aún pendiente).
    /// </summary>
    [HttpPost("tickets/{ticketId:guid}/keep")]
    public async Task<IActionResult> KeepTicket(Guid ticketId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var ticket = await _db.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket is null || ticket.Order.UsuarioId != userId.Value)
            return NotFound(new { message = "Boleto no encontrado." });

        if (ticket.Status != TicketStatus.VALID)
            return BadRequest(new { message = "Este boleto ya no se encuentra activo." });

        var ev = ticket.Order.Event;
        if (ev is null || ev.Status != EventStatus.RESCHEDULED)
            return BadRequest(new { message = "La opción de mantener boleto aplica para eventos reprogramados." });

        var existing = await _db.RefundRequests
            .Where(r => r.TicketId == ticket.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            if (existing.Status == "REFUNDED")
                return BadRequest(new { message = "Este boleto ya fue reembolsado y no puede reactivarse." });

            existing.Status = "KEPT";
            existing.EventTriggerStatus = EventStatus.RESCHEDULED.ToString();
            existing.ResolutionNotes = "El comprador confirmó conservar su boleto para la nueva fecha.";
            existing.ResolvedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new RefundRequest
            {
                TicketId = ticket.Id,
                OrderId = ticket.OrderId,
                EventId = ev.Id,
                UserId = userId.Value,
                Amount = ticket.Price,
                EventTriggerStatus = EventStatus.RESCHEDULED.ToString(),
                Status = "KEPT",
                Reason = "Confirmación de asistencia a nueva fecha",
                ResolutionNotes = "El comprador confirmó conservar su boleto para la nueva fecha.",
                CreatedAt = DateTime.UtcNow,
                ResolvedAt = DateTime.UtcNow
            };
            _db.RefundRequests.Add(existing);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            exito = true,
            message = "¡Perfecto! Tu boleto permanece activo y válido para la nueva fecha del evento.",
            refundStatus = "KEPT"
        });
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyRefunds()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var list = await _db.RefundRequests
            .AsNoTracking()
            .Include(r => r.Ticket)
            .Include(r => r.Event)
            .Where(r => r.UserId == userId.Value)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.TicketId,
                TicketCode = r.Ticket.TicketCode,
                r.OrderId,
                r.EventId,
                EventName = r.Event.Name,
                EventStatus = r.Event.Status.ToString(),
                r.Amount,
                r.Status,
                r.Reason,
                r.ResolutionNotes,
                r.CreatedAt,
                r.ResolvedAt
            })
            .ToListAsync();

        return Ok(list);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ENDPOINTS PARA ORGANIZADOR Y ADMINISTRADOR (PANEL REACT)
    // ═══════════════════════════════════════════════════════════════════════

    [HttpGet]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> GetAllRefunds([FromQuery] Guid? eventId, [FromQuery] string? status)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        if (!isAdmin && organizerId is null)
            return Forbid();

        var query = _db.RefundRequests
            .AsNoTracking()
            .Include(r => r.Ticket).ThenInclude(t => t.EventSection)
            .Include(r => r.Order)
            .Include(r => r.Event)
            .Include(r => r.User)
            .AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(r => r.Event.OrganizerId == organizerId!.Value);
        }

        if (eventId.HasValue)
        {
            query = query.Where(r => r.EventId == eventId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var norm = status.Trim().ToUpperInvariant();
            query = query.Where(r => r.Status == norm);
        }

        var items = await query
            .OrderByDescending(r => r.Status == "PENDING")
            .ThenByDescending(r => r.CreatedAt)
            .Select(r => new RefundItemAdminDto(
                r.Id,
                r.TicketId,
                r.Ticket.TicketCode,
                r.Ticket.EventSection != null ? r.Ticket.EventSection.Name : "General",
                r.OrderId,
                r.Order.ReferenceCode,
                r.EventId,
                r.Event.Name,
                r.Event.Status.ToString(),
                r.Event.StartDate,
                r.UserId,
                r.Ticket.AttendeeName,
                r.Ticket.AttendeeEmail,
                r.Amount,
                r.EventTriggerStatus,
                r.Status,
                r.Reason,
                r.ResolutionNotes,
                r.CreatedAt,
                r.ResolvedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>
    /// Resumen detallado por evento para la vista de Detalle de Evento en React Admin/Organizador,
    /// incluyendo tanto solicitudes de reembolso como todos los boletos afectados del evento.
    /// </summary>
    [HttpGet("events/{eventId:guid}/summary")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> GetEventRefundSummary(Guid eventId)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        var ev = await _db.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventId);
        if (ev is null) return NotFound(new { message = "Evento no encontrado." });

        if (!isAdmin && ev.OrganizerId != organizerId)
            return Forbid();

        var tickets = await _db.Tickets
            .AsNoTracking()
            .Include(t => t.Order)
            .Include(t => t.EventSection)
            .Where(t => t.Order.EventId == eventId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var refunds = await _db.RefundRequests
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var latestByTicket = refunds
            .GroupBy(r => r.TicketId)
            .ToDictionary(g => g.Key, g => g.First());

        var ticketRows = tickets.Select(t =>
        {
            latestByTicket.TryGetValue(t.Id, out var refReq);
            return new EventTicketRefundRowDto(
                TicketId: t.Id,
                TicketCode: t.TicketCode,
                OrderId: t.OrderId,
                OrderReference: t.Order.ReferenceCode,
                SectionName: t.EventSection?.Name ?? "General",
                AttendeeName: t.AttendeeName,
                AttendeeEmail: t.AttendeeEmail,
                Price: t.Price,
                TicketStatus: t.Status.ToString(),
                RefundId: refReq?.Id,
                RefundStatus: refReq?.Status,
                Reason: refReq?.Reason,
                ResolutionNotes: refReq?.ResolutionNotes,
                RequestedAt: refReq?.CreatedAt,
                ResolvedAt: refReq?.ResolvedAt
            );
        }).ToList();

        var pendingRows = ticketRows.Where(r => r.RefundStatus == "PENDING").ToList();
        var refundedRows = ticketRows.Where(r => r.RefundStatus == "REFUNDED").ToList();
        var keptRows = ticketRows.Where(r => r.RefundStatus == "KEPT" && r.TicketStatus == "VALID").ToList();
        var undecidedValidRows = ticketRows.Where(r => r.TicketStatus == "VALID" && r.RefundStatus is null).ToList();

        return Ok(new
        {
            eventId = ev.Id,
            eventName = ev.Name,
            eventStatus = ev.Status.ToString(),
            totalTickets = ticketRows.Count,
            validTickets = ticketRows.Count(r => r.TicketStatus == "VALID"),
            usedTickets = ticketRows.Count(r => r.TicketStatus == "USED"),
            pendingRefundsCount = pendingRows.Count,
            refundedCount = refundedRows.Count,
            keptCount = keptRows.Count,
            undecidedValidCount = undecidedValidRows.Count,
            pendingRefundAmount = pendingRows.Sum(r => r.Price),
            totalRefundedAmount = refundedRows.Sum(r => r.Price),
            tickets = ticketRows
        });
    }

    /// <summary>
    /// Aprueba y ejecuta la devolución del dinero de una solicitud de reembolso.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> ApproveRefund(Guid id, [FromBody] ResolveRefundDto? dto)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        var refund = await _db.RefundRequests
            .Include(r => r.Ticket).ThenInclude(t => t.EventSection)
            .Include(r => r.Order).ThenInclude(o => o.Pago)
            .Include(r => r.Order).ThenInclude(o => o.Tickets)
            .Include(r => r.Event)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (refund is null)
            return NotFound(new { message = "Solicitud de reembolso no encontrada." });

        if (!isAdmin && refund.Event.OrganizerId != organizerId)
            return Forbid();

        if (refund.Status == "REFUNDED")
            return BadRequest(new { message = "Esta solicitud ya fue reembolsada previamente." });

        if (refund.Ticket.Status == TicketStatus.USED)
            return BadRequest(new { message = "No se puede reembolsar un boleto que ya fue utilizado para ingresar." });

        var gatewayNote = await EjecutarReembolsoBoletoAsync(refund.Ticket, refund.Order, refund.Amount);

        refund.Status = "REFUNDED";
        refund.ResolvedAt = DateTime.UtcNow;
        refund.ResolutionNotes = !string.IsNullOrWhiteSpace(dto?.Notes)
            ? dto!.Notes!.Trim()
            : gatewayNote;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            action: "REFUND_APPROVED",
            entityType: "RefundRequest",
            entityId: refund.Id,
            userId: User.GetUserId(),
            details: $"Reembolso aprobado para boleto {refund.Ticket.TicketCode} por ${refund.Amount:0.00}. {gatewayNote}",
            httpContext: HttpContext);

        return Ok(new
        {
            exito = true,
            message = "Reembolso aprobado y dinero devuelto exitosamente.",
            refundId = refund.Id,
            status = refund.Status,
            amount = refund.Amount
        });
    }

    /// <summary>
    /// Rechaza una solicitud de reembolso (por ejemplo, si aplica conservar el boleto).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> RejectRefund(Guid id, [FromBody] ResolveRefundDto? dto)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        var refund = await _db.RefundRequests
            .Include(r => r.Ticket)
            .Include(r => r.Event)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (refund is null)
            return NotFound(new { message = "Solicitud de reembolso no encontrada." });

        if (!isAdmin && refund.Event.OrganizerId != organizerId)
            return Forbid();

        if (refund.Status == "REFUNDED")
            return BadRequest(new { message = "No se puede rechazar un reembolso ya ejecutado." });

        refund.Status = "REJECTED";
        refund.ResolvedAt = DateTime.UtcNow;
        refund.ResolutionNotes = string.IsNullOrWhiteSpace(dto?.Notes)
            ? "Solicitud rechazada; tu boleto continúa activo."
            : dto!.Notes!.Trim();

        await _db.SaveChangesAsync();

        return Ok(new
        {
            exito = true,
            message = "Solicitud marcada como rechazada. El boleto continúa activo.",
            refundId = refund.Id,
            status = refund.Status
        });
    }

    /// <summary>
    /// Permite al Organizador o Administrador reembolsar directamente un boleto válido
    /// de un evento CANCELADO o REPROGRAMADO (incluso si el cliente aún no presionó el botón).
    /// </summary>
    [HttpPost("tickets/{ticketId:guid}/direct-refund")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> DirectRefundTicket(Guid ticketId, [FromBody] ResolveRefundDto? dto)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        var ticket = await _db.Tickets
            .Include(t => t.Order).ThenInclude(o => o.Pago)
            .Include(t => t.Order).ThenInclude(o => o.Tickets)
            .Include(t => t.Order).ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket is null)
            return NotFound(new { message = "Boleto no encontrado." });

        var ev = ticket.Order.Event;
        if (!isAdmin && ev.OrganizerId != organizerId)
            return Forbid();

        if (ev.Status != EventStatus.CANCELLED && ev.Status != EventStatus.RESCHEDULED)
            return BadRequest(new { message = "El reembolso directo aplica únicamente para eventos reprogramados o cancelados." });

        if (ticket.Status == TicketStatus.USED)
            return BadRequest(new { message = "Este boleto ya fue utilizado en el acceso." });

        var existing = await _db.RefundRequests
            .Where(r => r.TicketId == ticket.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (existing?.Status == "REFUNDED" || ticket.Status == TicketStatus.CANCELLED)
            return BadRequest(new { message = "Este boleto ya fue reembolsado o cancelado." });

        var gatewayNote = await EjecutarReembolsoBoletoAsync(ticket, ticket.Order, ticket.Price);

        if (existing != null)
        {
            existing.Status = "REFUNDED";
            existing.ResolvedAt = DateTime.UtcNow;
            existing.ResolutionNotes = !string.IsNullOrWhiteSpace(dto?.Notes) ? dto!.Notes!.Trim() : gatewayNote;
        }
        else
        {
            existing = new RefundRequest
            {
                TicketId = ticket.Id,
                OrderId = ticket.OrderId,
                EventId = ev.Id,
                UserId = ticket.Order.UsuarioId,
                Amount = ticket.Price,
                EventTriggerStatus = ev.Status.ToString(),
                Status = "REFUNDED",
                Reason = $"Reembolso emitido por administración ({ev.Status})",
                ResolutionNotes = !string.IsNullOrWhiteSpace(dto?.Notes) ? dto!.Notes!.Trim() : gatewayNote,
                CreatedAt = DateTime.UtcNow,
                ResolvedAt = DateTime.UtcNow
            };
            _db.RefundRequests.Add(existing);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            exito = true,
            message = $"Boleto {ticket.TicketCode} reembolsado exitosamente (${ticket.Price:0.00} MXN).",
            refundId = existing.Id,
            status = "REFUNDED"
        });
    }

    /// <summary>
    /// Reembolso masivo para un evento CANCELADO o REPROGRAMADO:
    /// - Si onlyRequested=true: aprueba y reembolsa todas las solicitudes PENDING del evento.
    /// - Si onlyRequested=false: reembolsa TODOS los boletos VALID del evento (ideal cuando un evento se cancela definitivamente).
    /// </summary>
    [HttpPost("events/{eventId:guid}/refund-all")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> RefundAllForEvent(Guid eventId, [FromBody] BatchRefundEventDto? dto)
    {
        var isAdmin = User.IsAdminUser();
        var organizerId = User.GetOrganizerId();

        var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        if (ev is null)
            return NotFound(new { message = "Evento no encontrado." });

        if (!isAdmin && ev.OrganizerId != organizerId)
            return Forbid();

        if (ev.Status != EventStatus.CANCELLED && ev.Status != EventStatus.RESCHEDULED)
            return BadRequest(new { message = "El evento debe estar cancelado o reprogramado para ejecutar reembolsos masivos." });

        var onlyRequested = dto?.OnlyRequested ?? (ev.Status == EventStatus.RESCHEDULED);

        var tickets = await _db.Tickets
            .Include(t => t.Order).ThenInclude(o => o.Pago)
            .Include(t => t.Order).ThenInclude(o => o.Tickets)
            .Where(t => t.Order.EventId == eventId && t.Status == TicketStatus.VALID)
            .ToListAsync();

        var existingRefunds = await _db.RefundRequests
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var refundMap = existingRefunds
            .GroupBy(r => r.TicketId)
            .ToDictionary(g => g.Key, g => g.First());

        var processedCount = 0;
        decimal totalRefunded = 0m;

        foreach (var ticket in tickets)
        {
            refundMap.TryGetValue(ticket.Id, out var req);
            if (req?.Status == "REFUNDED") continue;

            if (onlyRequested && req?.Status != "PENDING")
                continue;

            // Si el evento es reprogramado y el usuario explícitamente eligió KEPT, respetamos su decisión
            if (!onlyRequested && ev.Status == EventStatus.RESCHEDULED && req?.Status == "KEPT")
                continue;

            var gatewayNote = await EjecutarReembolsoBoletoAsync(ticket, ticket.Order, ticket.Price);

            if (req != null)
            {
                req.Status = "REFUNDED";
                req.ResolvedAt = DateTime.UtcNow;
                req.ResolutionNotes = gatewayNote;
            }
            else
            {
                _db.RefundRequests.Add(new RefundRequest
                {
                    TicketId = ticket.Id,
                    OrderId = ticket.OrderId,
                    EventId = ev.Id,
                    UserId = ticket.Order.UsuarioId,
                    Amount = ticket.Price,
                    EventTriggerStatus = ev.Status.ToString(),
                    Status = "REFUNDED",
                    Reason = ev.Status == EventStatus.CANCELLED
                        ? "Reembolso automático por cancelación del evento"
                        : "Reembolso masivo por reprogramación",
                    ResolutionNotes = gatewayNote,
                    CreatedAt = DateTime.UtcNow,
                    ResolvedAt = DateTime.UtcNow
                });
            }

            processedCount++;
            totalRefunded += ticket.Price;
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            exito = true,
            processedCount,
            totalRefunded,
            message = processedCount > 0
                ? $"Se reembolsaron {processedCount} boleto(s) por un total de ${totalRefunded:0.00} MXN."
                : "No había boletos pendientes por reembolsar bajo este criterio."
        });
    }

    // ── Helper interno: ejecuta reembolso en pasarela, cancela ticket, libera inventario y actualiza orden ──
    private async Task<string> EjecutarReembolsoBoletoAsync(Ticket ticket, Order order, decimal amount)
    {
        var gatewayNote = "Reembolso acreditado en plataforma.";

        if (order.Pago != null && !string.IsNullOrWhiteSpace(order.Pago.ReferenciaExterna))
        {
            var refExterna = order.Pago.ReferenciaExterna;
            if (long.TryParse(refExterna, out _))
            {
                try
                {
                    await _procesadorPago.ReembolsarAsync(refExterna, amount);
                    gatewayNote = $"Reembolso ejecutado en Mercado Pago (ref. {refExterna}).";
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Mercado Pago no pudo procesar el reembolso directo de {Ref}; se acredita en sistema.", refExterna);
                    gatewayNote = $"Reembolso autorizado en plataforma (pasarela externa ref. {refExterna}: {ex.Message}).";
                }
            }
            else
            {
                await _procesadorPago.ReembolsarAsync(refExterna, amount);
                gatewayNote = "Reembolso acreditado (pago de prueba / simulado).";
            }
        }

        // Marcar el boleto como CANCELLED para impedir su uso en escáner
        ticket.Status = TicketStatus.CANCELLED;

        // Liberar 1 lugar en TiposBoleto si existe registro sincronizado para esa sección
        var tipoBoleto = await _db.TiposBoleto.FirstOrDefaultAsync(tb => tb.Id == ticket.EventSectionId);
        if (tipoBoleto != null && tipoBoleto.CantidadVendida > 0)
        {
            tipoBoleto.CantidadVendida = Math.Max(0, tipoBoleto.CantidadVendida - 1);
        }

        // Si todos los boletos de la orden quedaron cancelados, la orden pasa a REFUNDED
        var otrosActivos = order.Tickets.Any(t => t.Id != ticket.Id && t.Status != TicketStatus.CANCELLED);
        if (!otrosActivos)
        {
            order.Estado = EstadoOrden.Reembolsada;
            order.UpdatedAt = DateTime.UtcNow;
            if (order.Pago != null)
            {
                order.Pago.Estado = "refunded";
            }
        }

        return gatewayNote;
    }
}

public record RequestRefundDto(string? Reason);
public record ResolveRefundDto(string? Notes);
public record BatchRefundEventDto(bool? OnlyRequested = null);

public record RefundItemAdminDto(
    Guid Id,
    Guid TicketId,
    string TicketCode,
    string SectionName,
    Guid OrderId,
    string OrderReference,
    Guid EventId,
    string EventName,
    string EventStatus,
    DateTime EventStartDate,
    Guid UserId,
    string AttendeeName,
    string AttendeeEmail,
    decimal Amount,
    string EventTriggerStatus,
    string Status,
    string? Reason,
    string? ResolutionNotes,
    DateTime CreatedAt,
    DateTime? ResolvedAt
);

public record EventTicketRefundRowDto(
    Guid TicketId,
    string TicketCode,
    Guid OrderId,
    string OrderReference,
    string SectionName,
    string AttendeeName,
    string AttendeeEmail,
    decimal Price,
    string TicketStatus,
    Guid? RefundId,
    string? RefundStatus,
    string? Reason,
    string? ResolutionNotes,
    DateTime? RequestedAt,
    DateTime? ResolvedAt
);
