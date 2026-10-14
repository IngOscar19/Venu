using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class EventTypeConfiguration : IEntityTypeConfiguration<EventType>
{
    public void Configure(EntityTypeBuilder<EventType> builder)
    {
        builder.ToTable("event_types");

        builder.HasKey(et => et.Id);

        builder.Property(et => et.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(et => et.Slug)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(et => et.Slug)
            .IsUnique();

        builder.Property(et => et.IsActive)
            .HasDefaultValue(true);

        builder.Property(et => et.CreatedAt)
            .HasDefaultValueSql("now()");

        // Datos iniciales — se insertan en el seeder, no aquí,
        // para evitar migraciones que dependan de IDs fijos.
    }
}
