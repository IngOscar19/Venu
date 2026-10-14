namespace EventTicketing.Api.Services.Interfaces;

public interface IAuditService
{
    /// <summary>
    /// Registra una acción en audit_logs.
    /// Fire and forget — nunca lanza excepciones al caller.
    /// </summary>
    Task LogAsync(
        string action,
        string entityType,
        Guid entityId,
        Guid? userId = null,
        string? details = null,
        HttpContext? httpContext = null);
}