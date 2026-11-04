namespace EventTicketing.Api.Domain.Entities;

public class TipoBoleto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int CantidadDisponible { get; set; }
    public int CantidadVendida { get; set; } = 0;

    public Event Evento { get; set; } = null!;
}
