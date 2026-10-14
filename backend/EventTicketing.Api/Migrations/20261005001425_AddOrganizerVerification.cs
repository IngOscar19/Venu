using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventTicketing.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizerVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "organizers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "PENDING",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "VerificationLevel",
                table: "organizers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Unverified");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Details = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_audit_logs_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "organizer_verifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Unverified"),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    TaxId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TaxIdValidated = table.Column<bool>(type: "boolean", nullable: false),
                    LegalName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IdDocumentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SelfieWithIdUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CompanyDocumentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    LegalRepresentativeDocumentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ClabeAccount = table.Column<string>(type: "character varying(18)", maxLength: 18, nullable: true),
                    ClabeVerified = table.Column<bool>(type: "boolean", nullable: false),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReviewNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReviewedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizer_verifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_organizer_verifications_organizers_OrganizerId",
                        column: x => x.OrganizerId,
                        principalTable: "organizers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_organizer_verifications_users_ReviewedByAdminId",
                        column: x => x.ReviewedByAdminId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_Action",
                table: "audit_logs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityType_EntityId",
                table: "audit_logs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_UserId",
                table: "audit_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_organizer_verifications_OrganizerId",
                table: "organizer_verifications",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_organizer_verifications_ReviewedByAdminId",
                table: "organizer_verifications",
                column: "ReviewedByAdminId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "organizer_verifications");

            migrationBuilder.DropColumn(
                name: "VerificationLevel",
                table: "organizers");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "organizers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "PENDING");
        }
    }
}
