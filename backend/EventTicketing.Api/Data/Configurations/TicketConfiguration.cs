using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");

        builder.HasKey(t => t.Id);

        // TicketCode es el valor que va en el QR — debe ser único
        builder.Property(t => t.TicketCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(t => t.TicketCode)
            .IsUnique();

        builder.Property(t => t.AttendeeName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.AttendeeEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.Price)
            .IsRequired()
            .HasColumnType("numeric(10,2)");

        // Enum como string: "VALID", "USED", "CANCELLED"
        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TicketStatus.VALID);

        builder.Property(t => t.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(t => t.Order)
            .WithMany(o => o.Tickets)
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.EventSection)
            .WithMany()
            .HasForeignKey(t => t.EventSectionId)
            .OnDelete(DeleteBehavior.Restrict); // No eliminar sección si tiene tickets vendidos
    }
}
