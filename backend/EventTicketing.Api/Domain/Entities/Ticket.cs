using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid EventSectionId { get; set; }
    public string TicketCode { get; set; } = GenerateCode();
    public string AttendeeName { get; set; } = string.Empty;
    public string AttendeeEmail { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.VALID;
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public EventSection EventSection { get; set; } = null!;

    // Compatibilidad con guías / modelos en español (Boleto)
    [NotMapped]
    public string CodigoQr
    {
        get => TicketCode;
        set => TicketCode = value;
    }

    [NotMapped]
    public TicketStatus Estado
    {
        get => Status;
        set => Status = value;
    }

    [NotMapped]
    public DateTime FechaEmision
    {
        get => CreatedAt;
        set => CreatedAt = value;
    }

    [NotMapped]
    public Guid EventoId => EventSection?.EventId ?? (Order != null ? Order.EventId : Guid.Empty);

    [NotMapped]
    public Guid UsuarioId => Order != null ? Order.UserId : Guid.Empty;

    public static string GenerateCode()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(8);
        return $"TKT-{Convert.ToHexString(randomBytes)}";
    }
}
