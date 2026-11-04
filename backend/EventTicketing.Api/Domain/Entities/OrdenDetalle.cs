namespace EventTicketing.Api.Domain.Entities;

public class OrdenDetalle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrdenId { get; set; }
    public Guid TipoBoletoId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }

    public Order Orden { get; set; } = null!;
    public TipoBoleto TipoBoleto { get; set; } = null!;
}
