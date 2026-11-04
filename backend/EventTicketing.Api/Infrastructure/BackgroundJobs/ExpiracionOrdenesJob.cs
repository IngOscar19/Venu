using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EventTicketing.Api.Infrastructure.BackgroundJobs;

public class ExpiracionOrdenesJob : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<ExpiracionOrdenesJob>? _logger;
    private readonly TimeSpan _intervalo = TimeSpan.FromMinutes(1);
    private readonly TimeSpan _tiempoLimite = TimeSpan.FromMinutes(15);

    public ExpiracionOrdenesJob(IServiceProvider services, ILogger<ExpiracionOrdenesJob>? logger = null)
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
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var limite = DateTime.UtcNow - _tiempoLimite;
                var ordenesVencidas = await db.Ordenes
                    .Include(o => o.Detalles).ThenInclude(d => d.TipoBoleto)
                    .Where(o => o.Estado == EstadoOrden.Pendiente && o.Fecha < limite)
                    .ToListAsync(stoppingToken);

                foreach (var orden in ordenesVencidas)
                {
                    foreach (var detalle in orden.Detalles)
                    {
                        if (detalle.TipoBoleto != null)
                        {
                            detalle.TipoBoleto.CantidadVendida -= detalle.Cantidad;
                        }
                    }

                    orden.Estado = EstadoOrden.Expirada;
                }

                if (ordenesVencidas.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger?.LogInformation("Se expiraron {Count} órdenes vencidas y se liberó inventario.", ordenesVencidas.Count);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger?.LogError(ex, "Error en ejecución de ExpiracionOrdenesJob.");
            }

            await Task.Delay(_intervalo, stoppingToken);
        }
    }
}
