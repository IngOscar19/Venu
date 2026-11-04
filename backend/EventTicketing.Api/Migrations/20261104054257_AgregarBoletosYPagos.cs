using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventTicketing.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarBoletosYPagos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_events_EventId",
                table: "orders");

            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_UserId",
                table: "orders");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "orders",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "orders",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "orders",
                newName: "event_id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "orders",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                table: "orders",
                newName: "total_amount");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "orders",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_orders_UserId",
                table: "orders",
                newName: "IX_orders_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_orders_EventId",
                table: "orders",
                newName: "IX_orders_event_id");

            migrationBuilder.CreateTable(
                name: "Pagos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenId = table.Column<Guid>(type: "uuid", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MetodoPago = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pagos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pagos_orders_OrdenId",
                        column: x => x.OrdenId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TiposBoleto",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Precio = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    CantidadDisponible = table.Column<int>(type: "integer", nullable: false),
                    CantidadVendida = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposBoleto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposBoleto_events_EventoId",
                        column: x => x.EventoId,
                        principalTable: "events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrdenDetalles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoBoletoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenDetalles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenDetalles_TiposBoleto_TipoBoletoId",
                        column: x => x.TipoBoletoId,
                        principalTable: "TiposBoleto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenDetalles_orders_OrdenId",
                        column: x => x.OrdenId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenDetalles_OrdenId",
                table: "OrdenDetalles",
                column: "OrdenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenDetalles_TipoBoletoId",
                table: "OrdenDetalles",
                column: "TipoBoletoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_OrdenId",
                table: "Pagos",
                column: "OrdenId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TiposBoleto_EventoId",
                table: "TiposBoleto",
                column: "EventoId");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_events_event_id",
                table: "orders",
                column: "event_id",
                principalTable: "events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_user_id",
                table: "orders",
                column: "user_id",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_events_event_id",
                table: "orders");

            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_user_id",
                table: "orders");

            migrationBuilder.DropTable(
                name: "OrdenDetalles");

            migrationBuilder.DropTable(
                name: "Pagos");

            migrationBuilder.DropTable(
                name: "TiposBoleto");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "orders",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "orders",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "event_id",
                table: "orders",
                newName: "EventId");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "orders",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "total_amount",
                table: "orders",
                newName: "TotalAmount");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "orders",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_orders_user_id",
                table: "orders",
                newName: "IX_orders_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_orders_event_id",
                table: "orders",
                newName: "IX_orders_EventId");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_events_EventId",
                table: "orders",
                column: "EventId",
                principalTable: "events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_UserId",
                table: "orders",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
