using EventTicketing.Api.Data;
using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Services.Interfaces;

namespace EventTicketing.Api.Services.Implementations;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string entityType,
        Guid entityId,
        Guid? userId = null,
        string? details = null,
        HttpContext? httpContext = null)
    {
        try
        {
            var log = new AuditLog
            {
                Id         = Guid.NewGuid(),
                Action     = action,
                EntityType = entityType,
                EntityId   = entityId,
                UserId     = userId,
                Details    = details,
                IpAddress  = GetIpAddress(httpContext),
                UserAgent  = httpContext?.Request.Headers.UserAgent.ToString(),
                CreatedAt  = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Nunca propagamos el error — la auditoría no debe romper
            // el flujo principal de la aplicación
            _logger.LogWarning(ex, "AuditService: no se pudo registrar la acción {Action} para {EntityType}/{EntityId}",
                action, entityType, entityId);
        }
    }

    private static string? GetIpAddress(HttpContext? context)
    {
        if (context == null) return null;

        // Respeta headers de proxy/load balancer
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
            return forwarded.Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString();
    }
}