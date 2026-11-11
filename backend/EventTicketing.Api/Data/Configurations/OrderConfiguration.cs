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

        builder.Property(o => o.UsuarioId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(o => o.EventId)
            .HasColumnName("event_id")
            .IsRequired();

        builder.Property(o => o.Total)
            .HasColumnName("total_amount")
            .IsRequired()
            .HasColumnType("numeric(10,2)");

        // Enum de estado almacenado en la columna status ("PENDING", "COMPLETED", "CANCELLED", "EXPIRED")
        builder.Property(o => o.Estado)
            .HasColumnName("status")
            .HasMaxLength(20)
            .HasConversion(
                e => e == EstadoOrden.Pendiente ? "PENDING"
                   : e == EstadoOrden.Pagada || e == EstadoOrden.Completada ? "COMPLETED"
                   : e == EstadoOrden.Cancelada ? "CANCELLED"
                   : e == EstadoOrden.Expirada ? "EXPIRED"
                   : "PENDING",
                s => s == "COMPLETED" || s == "Completada" || s == "PAID" || s == "Pagada" ? EstadoOrden.Pagada
                   : s == "CANCELLED" || s == "Cancelada" ? EstadoOrden.Cancelada
                   : s == "EXPIRED" || s == "Expirada" ? EstadoOrden.Expirada
                   : EstadoOrden.Pendiente)
            .HasDefaultValue(EstadoOrden.Pendiente);

        builder.Property(o => o.Fecha)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.Property(o => o.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");

        builder.HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Event)
            .WithMany()
            .HasForeignKey(o => o.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Tickets)
            .WithOne(t => t.Order)
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Detalles)
            .WithOne(d => d.Orden)
            .HasForeignKey(d => d.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Pago)
            .WithOne(p => p.Orden)
            .HasForeignKey<Pago>(p => p.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
