using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using EventTicketing.Api.Domain.Enums;

namespace EventTicketing.Api.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ReferenceCode { get; set; } = GenerateReferenceCode();
    public Guid UsuarioId { get; set; }
    public Guid EventId { get; set; }
    public decimal Total { get; set; }
    public EstadoOrden Estado { get; set; } = EstadoOrden.Pendiente;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relaciones
    public User User { get; set; } = null!;
    public Event Event { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<OrdenDetalle> Detalles { get; set; } = new List<OrdenDetalle>();
    public Pago? Pago { get; set; }

    // Compatibilidad transparente con nombres originales en inglés
    [NotMapped]
    public Guid UserId
    {
        get => UsuarioId;
        set => UsuarioId = value;
    }

    [NotMapped]
    public decimal TotalAmount
    {
        get => Total;
        set => Total = value;
    }

    [NotMapped]
    public DateTime CreatedAt
    {
        get => Fecha;
        set => Fecha = value;
    }

    [NotMapped]
    public OrderStatus Status
    {
        get => Estado switch
        {
            EstadoOrden.Pendiente => OrderStatus.PENDING,
            EstadoOrden.Completada => OrderStatus.COMPLETED,
            EstadoOrden.Cancelada => OrderStatus.CANCELLED,
            EstadoOrden.Expirada => OrderStatus.EXPIRED,
            _ => OrderStatus.PENDING
        };
        set => Estado = value switch
        {
            OrderStatus.PENDING => EstadoOrden.Pendiente,
            OrderStatus.COMPLETED => EstadoOrden.Completada,
            OrderStatus.CANCELLED => EstadoOrden.Cancelada,
            OrderStatus.EXPIRED => EstadoOrden.Expirada,
            _ => EstadoOrden.Pendiente
        };
    }

    public static string GenerateReferenceCode()
    {
        var randomNum = RandomNumberGenerator.GetInt32(100000, 999999);
        return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{randomNum}";
    }
}
