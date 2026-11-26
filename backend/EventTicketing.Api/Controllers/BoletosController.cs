using System.Security.Claims;
using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Infrastructure.Qr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("boletos")]
[Route("api/boletos")]
[Authorize]
public class BoletosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IGeneradorQr _generadorQr;
    private readonly IDynamicQrService _dynamicQr;

    public BoletosController(AppDbContext db, IGeneradorQr generadorQr, IDynamicQrService dynamicQr)
    {
        _db = db;
        _generadorQr = generadorQr;
        _dynamicQr = dynamicQr;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Detalle(Guid id)
    {
        var usuarioId = User.GetUserId();
        if (usuarioId is null) return Unauthorized();

        var boleto = await _db.Tickets
            .Include(t => t.Order)
                .ThenInclude(o => o.Event)
            .Include(t => t.EventSection)
            .FirstOrDefaultAsync(b => b.Id == id);

        // Solo el dueño del boleto (o un admin) puede verlo; 404 para no revelar existencia
        if (boleto is null || (boleto.Order.UsuarioId != usuarioId.Value && !User.IsAdminUser())) return NotFound();

        var refund = await _db.RefundRequests
            .AsNoTracking()
            .Where(r => r.TicketId == boleto.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        var png = _generadorQr.GenerarPng(boleto.CodigoQr);
        var qrBase64 = Convert.ToBase64String(png);

        return Ok(new
        {
            boleto.Id,
            boleto.EventoId,
            boleto.TicketCode,
            Estado = boleto.Estado.ToString(),
            boleto.UsedAt,
            boleto.FechaEmision,
            EventoNombre = boleto.Order?.Event?.Name ?? "Evento",
            EventStartDate = boleto.Order?.Event?.StartDate,
            VenueName = boleto.Order?.Event?.VenueName,
            SectionName = boleto.EventSection?.Name,
            EventStatus = (boleto.Order?.Event?.Status ?? Domain.Enums.EventStatus.PUBLISHED).ToString(),
            RefundStatus = refund?.Status,
            RefundRequestedAt = refund?.CreatedAt,
            RefundResolvedAt = refund?.ResolvedAt,
            QrBase64 = qrBase64,
            QrSeed = _dynamicQr.GenerarSeed(boleto.Id, boleto.TicketCode)
        });
    }

    [HttpGet("{id}/qr")]
    [HttpGet("{id}/qr.png")]
    public async Task<IActionResult> DescargarQr(Guid id)
    {
        var usuarioId = User.GetUserId();
        if (usuarioId is null) return Unauthorized();

        var boleto = await _db.Tickets.Include(t => t.Order).FirstOrDefaultAsync(t => t.Id == id);
        if (boleto is null || (boleto.Order.UsuarioId != usuarioId.Value && !User.IsAdminUser())) return NotFound();

        var png = _generadorQr.GenerarPng(boleto.CodigoQr);
        return File(png, "image/png");
    }
}

[ApiController]
[Route("usuarios/me")]
[Route("api/usuarios/me")]
[Authorize]
public class MisBoletosController : ControllerBase
{
    private readonly AppDbContext _db;

    public MisBoletosController(AppDbContext db) => _db = db;

    [HttpGet("boletos")]
    public async Task<IActionResult> MisBoletos()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var usuarioId))
        {
            return Unauthorized("Usuario no autenticado o token inválido.");
        }

        var boletos = await _db.Tickets
            .Include(b => b.Order)
            .Where(b => b.Order.UsuarioId == usuarioId)
            .Select(b => new
            {
                b.Id,
                EventoId = b.Order.EventId,
                Estado = b.Status.ToString(),
                FechaEmision = b.CreatedAt
            })
            .ToListAsync();

        return Ok(boletos);
    }
}
