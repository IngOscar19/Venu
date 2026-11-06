using System.Security.Claims;
using EventTicketing.Api.DTOs.Tickets;
using EventTicketing.Api.Infrastructure.Qr;
using EventTicketing.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventTicketing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IGeneradorQr _generadorQr;

    public TicketsController(ITicketService ticketService, IGeneradorQr generadorQr)
    {
        _ticketService = ticketService;
        _generadorQr = generadorQr;
    }

    [HttpPost("purchase")]
    public async Task<ActionResult<OrderDto>> Purchase([FromBody] CreateOrderDto dto)
    {
        var userId = GetUserId();
        var result = await _ticketService.PurchaseTicketsAsync(userId, dto);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("my-orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetMyOrders()
    {
        var userId = GetUserId();
        var result = await _ticketService.GetUserOrdersAsync(userId);
        return Ok(result);
    }

    [HttpGet("orders/{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(Guid id)
    {
        var userId = GetUserId();
        var result = await _ticketService.GetOrderByIdAsync(userId, id);
        return Ok(result);
    }

    [HttpGet("my-tickets")]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetMyTickets()
    {
        var userId = GetUserId();
        var result = await _ticketService.GetUserTicketsAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDto>> GetTicketById(Guid id)
    {
        var userId = GetUserId();
        var result = await _ticketService.GetTicketByIdAsync(userId, id);
        return Ok(result);
    }

    [HttpGet("{id:guid}/qr")]
    [HttpGet("{id:guid}/qr.png")]
    public async Task<IActionResult> GetTicketQr(Guid id)
    {
        var userId = GetUserId();
        var ticket = await _ticketService.GetTicketByIdAsync(userId, id);
        var png = _generadorQr.GenerarPng(ticket.TicketCode);
        return File(png, "image/png");
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var userId))
        {
            throw new UnauthorizedAccessException("Token de autenticación inválido.");
        }
        return userId;
    }
}
