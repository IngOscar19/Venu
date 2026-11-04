using Boleto = EventTicketing.Api.Domain.Entities.Ticket;
using Orden = EventTicketing.Api.Domain.Entities.Order;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using EventTicketing.Api.Infrastructure.Qr;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Application.Boletos;

public class GenerarBoletosService
{
    private readonly AppDbContext _db;
    private readonly IGeneradorQr _generadorQr;

    public GenerarBoletosService(AppDbContext db, IGeneradorQr generadorQr)
    {
        _db = db;
        _generadorQr = generadorQr;
    }

    public async Task GenerarParaOrdenAsync(Orden orden)
    {
        foreach (var boleto in orden.Tickets)
        {
            if (boleto.OrderId == Guid.Empty)
            {
                boleto.OrderId = orden.Id;
            }

            if (string.IsNullOrWhiteSpace(boleto.TicketCode))
            {
                boleto.TicketCode = Boleto.GenerateCode();
            }

            if (!_db.Tickets.Local.Contains(boleto))
            {
                _db.Boletos.Add(boleto);
            }
        }

        // SaveChanges lo hace quien llama (ConfirmarPagoCommand / PurchaseTickets), para que todo quede en una sola transacción
        await Task.CompletedTask;
    }

    public async Task<List<Boleto>> GenerarParaOrdenAsync(
        Orden orden,
        IEnumerable<(Guid SectionId, string AttendeeName, string AttendeeEmail, decimal Price)> items)
    {
        var boletos = new List<Boleto>();

        foreach (var item in items)
        {
            var boleto = new Boleto
            {
                OrderId = orden.Id,
                EventSectionId = item.SectionId,
                AttendeeName = item.AttendeeName.Trim(),
                AttendeeEmail = item.AttendeeEmail.Trim().ToLower(),
                Price = item.Price,
                Status = TicketStatus.VALID,
                CreatedAt = DateTime.UtcNow
                // CodigoQr ya se autogenera en el constructor de la entidad
            };

            orden.Tickets.Add(boleto);
            _db.Boletos.Add(boleto);
            boletos.Add(boleto);
        }

        await Task.CompletedTask;
        return boletos;
    }
}
