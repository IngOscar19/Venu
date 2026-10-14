using EventTicketing.Api.DTOs.Tickets;

namespace EventTicketing.Api.Services.Interfaces;

public interface ITicketService
{
    Task<OrderDto> PurchaseTicketsAsync(Guid userId, CreateOrderDto dto);
    Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId);
    Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId);
    Task<IEnumerable<TicketDto>> GetUserTicketsAsync(Guid userId);
    Task<TicketDto> GetTicketByIdAsync(Guid userId, Guid ticketId);
}
