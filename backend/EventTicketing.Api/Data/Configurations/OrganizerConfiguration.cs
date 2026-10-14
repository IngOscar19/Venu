using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class OrganizerVerificationConfiguration
    : IEntityTypeConfiguration<OrganizerVerification>
{
    public void Configure(EntityTypeBuilder<OrganizerVerification> builder)
    {
        builder.ToTable("organizer_verifications");

        builder.HasKey(v => v.Id);

        // Enums como string — legibles en queries SQL directas
        builder.Property(v => v.Level)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(VerificationLevel.Unverified);

        builder.Property(v => v.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(VerificationStatus.Pending);

        // Datos fiscales
        builder.Property(v => v.TaxId)
            .HasMaxLength(20); // RFC: 12-13 chars, CURP: 18 chars

        builder.Property(v => v.LegalName)
            .HasMaxLength(300);

        // URLs de documentos en storage
        builder.Property(v => v.IdDocumentUrl)
            .HasMaxLength(1000);

        builder.Property(v => v.SelfieWithIdUrl)
            .HasMaxLength(1000);

        builder.Property(v => v.CompanyDocumentUrl)
            .HasMaxLength(1000);

        builder.Property(v => v.LegalRepresentativeDocumentUrl)
            .HasMaxLength(1000);

        // Datos bancarios
        builder.Property(v => v.ClabeAccount)
            .HasMaxLength(18); // CLABE siempre es exactamente 18 dígitos

        builder.Property(v => v.BankName)
            .HasMaxLength(100);

        // Revisión
        builder.Property(v => v.ReviewNotes)
            .HasMaxLength(2000);

        builder.Property(v => v.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(v => v.SubmittedAt)
            .HasDefaultValueSql("now()");

        builder.Property(v => v.UpdatedAt)
            .HasDefaultValueSql("now()");

        // Un organizador puede tener múltiples intentos de verificación
        // (rechazos + correcciones + reenvíos)
        builder.HasOne(v => v.Organizer)
            .WithMany(o => o.Verifications)
            .HasForeignKey(v => v.OrganizerId)
            .OnDelete(DeleteBehavior.Cascade);

        // El admin que revisó — null si aún no hay revisión
        builder.HasOne(v => v.ReviewedByAdmin)
            .WithMany()
            .HasForeignKey(v => v.ReviewedByAdminId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
