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

    /// <summary>
    /// Genera un boleto por cada unidad de cada detalle de la orden pagada.
    /// No hace SaveChanges: lo hace quien llama para que todo quede en una sola transacción.
    /// </summary>
    public async Task GenerarDesdeOrdenAsync(Orden orden)
    {
        if (orden.Tickets.Count > 0 || await _db.Tickets.AnyAsync(t => t.OrderId == orden.Id)) return;

        var secciones = await _db.EventSections.Where(s => s.EventId == orden.EventId).ToListAsync();
        var nombre = $"{orden.User?.FirstName} {orden.User?.LastName}".Trim();
        var correo = orden.User?.Email ?? string.Empty;

        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(nombre))
        {
            var user = await _db.Users.FindAsync(orden.UsuarioId);
            if (user != null)
            {
                nombre = $"{user.FirstName} {user.LastName}".Trim();
                correo = user.Email;
            }
        }
        if (string.IsNullOrWhiteSpace(nombre)) nombre = "Asistente";
        if (string.IsNullOrWhiteSpace(correo)) correo = "asistente@venu.com";

        foreach (var detalle in orden.Detalles)
        {
            // TipoBoleto.Id == EventSection.Id (ver TiposBoletoSync); si no, se busca por nombre
            var seccion = secciones.FirstOrDefault(s => s.Id == detalle.TipoBoletoId)
                ?? secciones.FirstOrDefault(s => s.Name == detalle.TipoBoleto?.Nombre)
                ?? secciones.FirstOrDefault();

            if (seccion is null)
            {
                seccion = new EventSection
                {
                    Id = detalle.TipoBoletoId != Guid.Empty ? detalle.TipoBoletoId : Guid.NewGuid(),
                    EventId = orden.EventId,
                    Name = detalle.TipoBoleto?.Nombre ?? "General",
                    Description = "Sección General",
                    Capacity = 1000,
                    BasePrice = detalle.PrecioUnitario,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.EventSections.Add(seccion);
                secciones.Add(seccion);
            }

            for (var i = 0; i < detalle.Cantidad; i++)
            {
                var boleto = new Boleto
                {
                    OrderId = orden.Id,
                    EventSectionId = seccion.Id,
                    AttendeeName = nombre,
                    AttendeeEmail = correo.ToLower(),
                    Price = detalle.PrecioUnitario,
                    Status = TicketStatus.VALID,
                    TicketCode = Boleto.GenerateCode(),
                    CreatedAt = DateTime.UtcNow
                };
                _db.Tickets.Add(boleto);
                orden.Tickets.Add(boleto);
            }
        }
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
            };

            orden.Tickets.Add(boleto);
            _db.Boletos.Add(boleto);
            boletos.Add(boleto);
        }

        await Task.CompletedTask;
        return boletos;
    }
}
