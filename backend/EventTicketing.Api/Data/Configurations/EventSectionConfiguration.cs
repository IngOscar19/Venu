using EventTicketing.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class EventSectionConfiguration : IEntityTypeConfiguration<EventSection>
{
    public void Configure(EntityTypeBuilder<EventSection> builder)
    {
        builder.ToTable("event_sections");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.Capacity)
            .IsRequired();

        builder.Property(s => s.BasePrice)
            .IsRequired()
            .HasColumnType("numeric(10,2)");

        builder.Property(s => s.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(s => s.UpdatedAt)
            .HasDefaultValueSql("now()");

        // Cascade: si se elimina el evento, se eliminan sus secciones
        builder.HasOne(s => s.Event)
            .WithMany(e => e.Sections)
            .HasForeignKey(s => s.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
