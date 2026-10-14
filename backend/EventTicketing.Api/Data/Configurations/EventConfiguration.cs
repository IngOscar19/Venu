using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("events");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Slug)
            .IsRequired()
            .HasMaxLength(250);

        builder.HasIndex(e => e.Slug)
            .IsUnique();

        builder.Property(e => e.Description)
            .HasMaxLength(5000);

        builder.Property(e => e.VenueName)
            .HasMaxLength(200);

        builder.Property(e => e.Address)
            .HasMaxLength(500);

        builder.Property(e => e.City)
            .HasMaxLength(100);

        builder.Property(e => e.State)
            .HasMaxLength(100);

        builder.Property(e => e.Capacity)
            .IsRequired();

        // Enum como string: "DRAFT", "PUBLISHED", "CANCELLED", "FINISHED"
        // Legible en reportes SQL y seguro si el enum crece
        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(EventStatus.DRAFT);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("now()");

        // Relación con Organizer — Restrict: no se puede eliminar
        // un organizador que tenga eventos asociados
        builder.HasOne(e => e.Organizer)
            .WithMany(o => o.Events)
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relación con EventType — SetNull: si se elimina un tipo,
        // los eventos existentes quedan sin tipo (no se pierden)
        builder.HasOne(e => e.EventType)
            .WithMany(et => et.Events)
            .HasForeignKey(e => e.EventTypeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
