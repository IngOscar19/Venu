namespace EventTicketing.Api.Domain.Entities;

public class Pago
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrdenId { get; set; }
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string ReferenciaExterna { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public Order Orden { get; set; } = null!;
}
