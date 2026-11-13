using EventTicketing.Api.Domain.Entities;
using EventTicketing.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventTicketing.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Migración preventiva para columnas y tablas de verificación telefónica
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE users ADD COLUMN IF NOT EXISTS ""PhoneNumber"" character varying(30);
                ALTER TABLE users ADD COLUMN IF NOT EXISTS ""PhoneVerified"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS ""PhoneVerifiedAt"" timestamp with time zone;

                CREATE TABLE IF NOT EXISTS ""PhoneVerificationCodes"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""UserId"" uuid NOT NULL,
                    ""PhoneNumber"" character varying(30) NOT NULL,
                    ""Code"" character varying(10) NOT NULL,
                    ""Attempts"" integer NOT NULL DEFAULT 0,
                    ""IsUsed"" boolean NOT NULL DEFAULT FALSE,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT (now()),
                    ""ExpiresAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""FK_PhoneVerificationCodes_users_UserId"" FOREIGN KEY (""UserId"") REFERENCES users (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_PhoneVerificationCodes_UserId_Code"" ON ""PhoneVerificationCodes"" (""UserId"", ""Code"");
            ");
        }
        catch
        {
            // En caso de que el proveedor o entorno no requiera o no soporte este comando raw
        }

        // EventTypes — catálogo base
        if (!await context.EventTypes.AnyAsync())
        {
            var eventTypes = new List<EventType>
            {
                new() { Id = Guid.NewGuid(), Name = "Concierto",      Slug = "concierto" },
                new() { Id = Guid.NewGuid(), Name = "Festival",        Slug = "festival" },
                new() { Id = Guid.NewGuid(), Name = "Teatro",          Slug = "teatro" },
                new() { Id = Guid.NewGuid(), Name = "Deporte",         Slug = "deporte" },
                new() { Id = Guid.NewGuid(), Name = "Conferencia",     Slug = "conferencia" },
                new() { Id = Guid.NewGuid(), Name = "Exposición",      Slug = "exposicion" },
                new() { Id = Guid.NewGuid(), Name = "Feria",           Slug = "feria" },
                new() { Id = Guid.NewGuid(), Name = "Otro",            Slug = "otro" },
            };
            context.EventTypes.AddRange(eventTypes);
        }

        // Usuario ADMIN por defecto con perfil de Organizador
        var adminUser = await context.Users.Include(u => u.Organizer).FirstOrDefaultAsync(u => u.Email == "admin@eventticketing.com");
        if (adminUser == null)
        {
            var adminId = Guid.NewGuid();
            var organizer = new Organizer
            {
                Id = Guid.NewGuid(),
                UserId = adminId,
                Name = "Venú Admin",
                Description = "Organizador principal de eventos",
                Status = OrganizerStatus.VERIFIED,
                CreatedAt = DateTime.UtcNow
            };

            adminUser = new User
            {
                Id = adminId,
                Email = "admin@eventticketing.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                FirstName = "Admin",
                LastName = "Sistema",
                Role = "ADMIN",
                IsActive = true,
                Organizer = organizer
            };
            context.Users.Add(adminUser);
            context.Organizers.Add(organizer);
        }
        else if (adminUser.Organizer == null)
        {
            var organizer = new Organizer
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                Name = "Venú Admin",
                Description = "Organizador principal de eventos",
                Status = OrganizerStatus.VERIFIED,
                CreatedAt = DateTime.UtcNow
            };
            adminUser.Organizer = organizer;
            context.Organizers.Add(organizer);
        }

        await context.SaveChangesAsync();
    }
}
