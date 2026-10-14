using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class EventImageConfiguration : IEntityTypeConfiguration<EventImage>
{
    public void Configure(EntityTypeBuilder<EventImage> builder)
    {
        builder.ToTable("event_images");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Url)
            .IsRequired()
            .HasMaxLength(1000);

        // Enum como string: "POSTER", "GALLERY", "VENUE", "ARTIST"
        builder.Property(i => i.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.Order)
            .HasDefaultValue(0);

        builder.Property(i => i.CreatedAt)
            .HasDefaultValueSql("now()");

        // Cascade: si se elimina el evento, se eliminan sus imágenes
        builder.HasOne(i => i.Event)
            .WithMany(e => e.Images)
            .HasForeignKey(i => i.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
