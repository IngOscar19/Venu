using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // ── Usuarios y acceso ────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<Organizer> Organizers => Set<Organizer>();
    public DbSet<OrganizerVerification> OrganizerVerifications => Set<OrganizerVerification>();

    // ── Catálogos ────────────────────────────────────────────────────
    public DbSet<EventType> EventTypes => Set<EventType>();

    // ── Eventos ──────────────────────────────────────────────────────
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventImage> EventImages => Set<EventImage>();
    public DbSet<EventSection> EventSections => Set<EventSection>();

    // ── Tickets y órdenes (entrega 2) ────────────────────────────────
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    // ── Auditoría ────────────────────────────────────────────────────
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}
