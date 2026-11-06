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

    // Modelos en español / compatibilidad con comandos y jobs
    public DbSet<Ticket> Boletos => Set<Ticket>();
    public DbSet<Order> Ordenes => Set<Order>();
    public DbSet<TipoBoleto> TiposBoleto => Set<TipoBoleto>();
    public DbSet<TipoBoleto> TiposBoletos => Set<TipoBoleto>();
    public DbSet<OrdenDetalle> OrdenDetalles => Set<OrdenDetalle>();
    public DbSet<Pago> Pagos => Set<Pago>();

    // ── Auditoría ────────────────────────────────────────────────────
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<TipoBoleto>(b =>
        {
            b.ToTable("TiposBoleto");
            b.HasKey(t => t.Id);
            b.Property(t => t.Nombre).IsRequired().HasMaxLength(100);
            b.Property(t => t.Precio).IsRequired().HasColumnType("numeric(10,2)");
            b.Property(t => t.CantidadDisponible).IsRequired();
            b.Property(t => t.CantidadVendida).HasDefaultValue(0);
            b.HasOne(t => t.Evento)
                .WithMany()
                .HasForeignKey(t => t.EventoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrdenDetalle>(b =>
        {
            b.ToTable("OrdenDetalles");
            b.HasKey(d => d.Id);
            b.Property(d => d.PrecioUnitario).IsRequired().HasColumnType("numeric(10,2)");
            b.Property(d => d.Cantidad).IsRequired();
            b.HasOne(d => d.Orden)
                .WithMany(o => o.Detalles)
                .HasForeignKey(d => d.OrdenId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(d => d.TipoBoleto)
                .WithMany()
                .HasForeignKey(d => d.TipoBoletoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pago>(b =>
        {
            b.ToTable("Pagos");
            b.HasKey(p => p.Id);
            b.Property(p => p.Monto).IsRequired().HasColumnType("numeric(10,2)");
            b.Property(p => p.MetodoPago).IsRequired().HasMaxLength(50);
            b.Property(p => p.Estado).IsRequired().HasMaxLength(50);
            b.Property(p => p.Fecha).HasDefaultValueSql("now()");
            b.HasOne(p => p.Orden)
                .WithOne(o => o.Pago)
                .HasForeignKey<Pago>(p => p.OrdenId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
