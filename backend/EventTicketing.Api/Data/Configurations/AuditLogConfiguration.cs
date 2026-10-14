using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(100);

        // Índice en Action para filtrar por tipo de evento en el dashboard de auditoría
        builder.HasIndex(a => a.Action);

        builder.Property(a => a.EntityType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45); // IPv4 (15) o IPv6 (45)

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        // JSON con contexto — texto libre, sin límite estricto
        builder.Property(a => a.Details)
            .HasColumnType("text");

        builder.Property(a => a.CreatedAt)
            .HasDefaultValueSql("now()");

        // Índice compuesto para buscar el historial de una entidad específica
        builder.HasIndex(a => new { a.EntityType, a.EntityId });

        // Índice en UserId para ver el historial de acciones de un usuario
        builder.HasIndex(a => a.UserId);

        // SetNull: si se borra el usuario, los logs quedan con UserId = null
        // Los logs NUNCA se borran — solo se inserta
        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
