using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventTicketing.Api.Migrations
{
    /// <inheritdoc />
    public partial class SincronizarModelo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReferenciaExterna",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReferenciaExterna",
                table: "Pagos");
        }
    }
}
