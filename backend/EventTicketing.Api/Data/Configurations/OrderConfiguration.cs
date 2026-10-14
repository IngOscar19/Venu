using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventTicketing.Api.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.ReferenceCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(o => o.ReferenceCode)
            .IsUnique();

        builder.Property(o => o.TotalAmount)
            .IsRequired()
            .HasColumnType("numeric(10,2)");

        // Enum como string: "PENDING", "COMPLETED", "CANCELLED", "REFUNDED"
        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(OrderStatus.PENDING);

        builder.Property(o => o.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(o => o.UpdatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict); // No eliminar usuario si tiene órdenes

        builder.HasOne(o => o.Event)
            .WithMany()
            .HasForeignKey(o => o.EventId)
            .OnDelete(DeleteBehavior.Restrict); // No eliminar evento si tiene órdenes
    }
}
