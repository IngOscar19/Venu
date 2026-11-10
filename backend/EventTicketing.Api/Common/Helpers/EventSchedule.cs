using EventTicketing.Api.Domain.Entities;

namespace EventTicketing.Api.Common.Helpers;

/// <summary>
/// Calcula cuándo termina realmente un evento. Las fechas/horas del evento se capturan
/// en hora local de México, por lo que se comparan contra la hora local de México.
/// </summary>
public static class EventSchedule
{
    private static readonly TimeZoneInfo MexicoZone = ResolveZone();

    private static TimeZoneInfo ResolveZone()
    {
        foreach (var id in new[] { "America/Mexico_City", "Central Standard Time (Mexico)", "Central Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); } catch { /* probar siguiente */ }
        }
        // México ya no usa horario de verano: UTC-6 fijo
        return TimeZoneInfo.CreateCustomTimeZone("MX", TimeSpan.FromHours(-6), "MX", "MX");
    }

    public static DateTime NowLocal() => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MexicoZone);

    /// <summary>Fecha y hora local en que termina el evento (soporta eventos que cruzan la medianoche).</summary>
    public static DateTime EndLocal(Event e)
    {
        var endDate = (e.EndDate == default ? e.StartDate : e.EndDate).Date;
        var end = endDate + e.EndTime;

        var start = e.StartDate.Date + e.StartTime;
        if (end <= start && e.EndTime <= e.StartTime && endDate == e.StartDate.Date)
            end = end.AddDays(1); // ej. 22:00 -> 02:00

        // Si no se capturó hora de fin, el evento dura hasta el final del día
        if (e.EndTime == TimeSpan.Zero && e.StartTime == TimeSpan.Zero)
            end = endDate.AddDays(1);

        return end;
    }

    public static bool HasEnded(Event e) => EndLocal(e) <= NowLocal();

    /// <summary>Cota gruesa para filtrar en SQL (el refinamiento exacto se hace en memoria).</summary>
    public static DateTime CoarseCutoffDate() => NowLocal().Date.AddDays(-1);
}
