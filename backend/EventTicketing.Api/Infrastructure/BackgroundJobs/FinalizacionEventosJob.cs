using EventTicketing.Api.Common.Helpers;
using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Infrastructure.BackgroundJobs;

/// <summary>
/// Retira de la plataforma los eventos cuya fecha/hora de término ya pasó:
/// los marca como FINISHED. Los eventos FINISHED dejan de aparecer en el catálogo público,
/// no se pueden comprar y no aparecen en las listas de organizador/admin (salvo historial).
/// Se conservan en BD para no romper órdenes, pagos ni boletos ya emitidos.
/// </summary>
public class FinalizacionEventosJob : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<FinalizacionEventosJob> _logger;
    private readonly TimeSpan _intervalo = TimeSpan.FromMinutes(5);

    public FinalizacionEventosJob(IServiceProvider services, ILogger<FinalizacionEventosJob> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var finalizados = await FinalizarVencidosAsync(db, stoppingToken);
                if (finalizados > 0)
                    _logger.LogInformation("Se finalizaron {Count} eventos cuya fecha ya pasó.", finalizados);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error en FinalizacionEventosJob.");
            }

            try { await Task.Delay(_intervalo, stoppingToken); }
            catch (TaskCanceledException) { break; }
        }
    }

    public static async Task<int> FinalizarVencidosAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        // Npgsql exige Kind=Utc para columnas timestamptz; las fechas guardadas son solo-fecha
        var corte = DateTime.SpecifyKind(EventSchedule.CoarseCutoffDate().AddDays(2), DateTimeKind.Utc);
        var candidatos = await db.Events
            .Where(e => e.Status != EventStatus.FINISHED
                        && e.Status != EventStatus.CANCELLED
                        && (e.EndDate <= corte || e.StartDate <= corte))
            .ToListAsync(ct);

        var vencidos = candidatos.Where(EventSchedule.HasEnded).ToList();
        foreach (var ev in vencidos)
        {
            ev.Status = EventStatus.FINISHED;
            ev.UpdatedAt = DateTime.UtcNow;
        }

        if (vencidos.Count > 0) await db.SaveChangesAsync(ct);
        return vencidos.Count;
    }
}
