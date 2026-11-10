using System.Security.Claims;

namespace EventTicketing.Api.Common.Helpers;

public static class ClaimsExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    public static bool IsAdminUser(this ClaimsPrincipal user) =>
        user.IsInRole("ADMIN")
        || string.Equals(user.FindFirst(ClaimTypes.Role)?.Value, "ADMIN", StringComparison.OrdinalIgnoreCase)
        || string.Equals(user.FindFirst("role")?.Value, "ADMIN", StringComparison.OrdinalIgnoreCase);

    public static bool IsOrganizerUser(this ClaimsPrincipal user) =>
        string.Equals(user.FindFirst(ClaimTypes.Role)?.Value, "ORGANIZER", StringComparison.OrdinalIgnoreCase)
        || string.Equals(user.FindFirst("role")?.Value, "ORGANIZER", StringComparison.OrdinalIgnoreCase);

    public static Guid? GetOrganizerId(this ClaimsPrincipal user)
    {
        var claim = user.Claims.FirstOrDefault(c => c.Type == "organizerId")?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
