using System.Security.Claims;
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

    public BoletosController(AppDbContext db, IGeneradorQr generadorQr)
    {
        _db = db;
        _generadorQr = generadorQr;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Detalle(Guid id)
    {
        var boleto = await _db.Tickets
            .Include(t => t.Order)
            .Include(t => t.EventSection)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (boleto is null) return NotFound();

        var png = _generadorQr.GenerarPng(boleto.CodigoQr);
        var qrBase64 = Convert.ToBase64String(png);

        return Ok(new
        {
            boleto.Id,
            boleto.EventoId,
            Estado = boleto.Estado.ToString(),
            boleto.FechaEmision,
            QrBase64 = qrBase64 // Flutter lo pinta con Image.memory(base64Decode(...))
        });
    }

    [HttpGet("{id}/qr")]
    [HttpGet("{id}/qr.png")]
    public async Task<IActionResult> DescargarQr(Guid id)
    {
        var boleto = await _db.Tickets.FindAsync(id);
        if (boleto is null) return NotFound();

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
            .Where(b => b.Order.UserId == usuarioId)
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
