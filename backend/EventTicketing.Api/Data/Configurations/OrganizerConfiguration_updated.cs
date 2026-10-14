using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class OrganizerConfiguration : IEntityTypeConfiguration<Organizer>
{
    public void Configure(EntityTypeBuilder<Organizer> builder)
    {
        builder.ToTable("organizers");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(o => o.Description)
            .HasMaxLength(1000);

        // PENDING por defecto — no VERIFIED hasta que el admin apruebe
        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(OrganizerStatus.PENDING);

        // Nivel de verificación — controla qué puede publicar
        builder.Property(o => o.VerificationLevel)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(VerificationLevel.Unverified);

        builder.Property(o => o.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(o => o.UpdatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(o => o.User)
            .WithOne(u => u.Organizer)
            .HasForeignKey<Organizer>(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
