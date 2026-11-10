CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE event_types (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Slug" character varying(120) NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_event_types" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE users (
        "Id" uuid NOT NULL,
        "Email" character varying(256) NOT NULL,
        "PasswordHash" text NOT NULL,
        "FirstName" character varying(100) NOT NULL,
        "LastName" character varying(100) NOT NULL,
        "Role" character varying(30) NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_users" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE organizers (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "Status" character varying(20) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_organizers" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_organizers_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE events (
        "Id" uuid NOT NULL,
        "OrganizerId" uuid NOT NULL,
        "EventTypeId" uuid,
        "Name" character varying(200) NOT NULL,
        "Slug" character varying(250) NOT NULL,
        "Description" character varying(5000) NOT NULL,
        "StartDate" timestamp with time zone NOT NULL,
        "EndDate" timestamp with time zone NOT NULL,
        "StartTime" interval NOT NULL,
        "EndTime" interval NOT NULL,
        "VenueName" character varying(200) NOT NULL,
        "Address" character varying(500) NOT NULL,
        "City" character varying(100) NOT NULL,
        "State" character varying(100) NOT NULL,
        "Latitude" double precision,
        "Longitude" double precision,
        "Capacity" integer NOT NULL,
        "Status" character varying(20) NOT NULL DEFAULT 'DRAFT',
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_events" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_events_event_types_EventTypeId" FOREIGN KEY ("EventTypeId") REFERENCES event_types ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_events_organizers_OrganizerId" FOREIGN KEY ("OrganizerId") REFERENCES organizers ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE event_images (
        "Id" uuid NOT NULL,
        "EventId" uuid NOT NULL,
        "Url" character varying(1000) NOT NULL,
        "Type" character varying(20) NOT NULL,
        "Order" integer NOT NULL DEFAULT 0,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_event_images" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_event_images_events_EventId" FOREIGN KEY ("EventId") REFERENCES events ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE event_sections (
        "Id" uuid NOT NULL,
        "EventId" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(500),
        "Capacity" integer NOT NULL,
        "BasePrice" numeric(10,2) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_event_sections" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_event_sections_events_EventId" FOREIGN KEY ("EventId") REFERENCES events ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE orders (
        "Id" uuid NOT NULL,
        "ReferenceCode" character varying(50) NOT NULL,
        "UserId" uuid NOT NULL,
        "EventId" uuid NOT NULL,
        "TotalAmount" numeric(10,2) NOT NULL,
        "Status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_orders" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_orders_events_EventId" FOREIGN KEY ("EventId") REFERENCES events ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE TABLE tickets (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "EventSectionId" uuid NOT NULL,
        "TicketCode" character varying(100) NOT NULL,
        "AttendeeName" character varying(200) NOT NULL,
        "AttendeeEmail" character varying(256) NOT NULL,
        "Price" numeric(10,2) NOT NULL,
        "Status" character varying(20) NOT NULL DEFAULT 'VALID',
        "UsedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_tickets" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_tickets_event_sections_EventSectionId" FOREIGN KEY ("EventSectionId") REFERENCES event_sections ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tickets_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_event_images_EventId" ON event_images ("EventId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_event_sections_EventId" ON event_sections ("EventId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_event_types_Slug" ON event_types ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_events_EventTypeId" ON events ("EventTypeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_events_OrganizerId" ON events ("OrganizerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_events_Slug" ON events ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_orders_EventId" ON orders ("EventId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_orders_ReferenceCode" ON orders ("ReferenceCode");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_orders_UserId" ON orders ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_organizers_UserId" ON organizers ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_tickets_EventSectionId" ON tickets ("EventSectionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE INDEX "IX_tickets_OrderId" ON tickets ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_tickets_TicketCode" ON tickets ("TicketCode");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_users_Email" ON users ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261004055509_InitialSchema') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261004055509_InitialSchema', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    ALTER TABLE organizers ALTER COLUMN "Status" SET DEFAULT 'PENDING';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    ALTER TABLE organizers ADD "VerificationLevel" character varying(20) NOT NULL DEFAULT 'Unverified';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE TABLE audit_logs (
        "Id" uuid NOT NULL,
        "UserId" uuid,
        "Action" character varying(100) NOT NULL,
        "EntityType" character varying(50) NOT NULL,
        "EntityId" uuid NOT NULL,
        "IpAddress" character varying(45),
        "UserAgent" character varying(500),
        "Details" text,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_audit_logs_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE TABLE organizer_verifications (
        "Id" uuid NOT NULL,
        "OrganizerId" uuid NOT NULL,
        "Level" character varying(20) NOT NULL DEFAULT 'Unverified',
        "Status" character varying(20) NOT NULL DEFAULT 'Pending',
        "TaxId" character varying(20),
        "TaxIdValidated" boolean NOT NULL,
        "LegalName" character varying(300),
        "IdDocumentUrl" character varying(1000),
        "SelfieWithIdUrl" character varying(1000),
        "CompanyDocumentUrl" character varying(1000),
        "LegalRepresentativeDocumentUrl" character varying(1000),
        "ClabeAccount" character varying(18),
        "ClabeVerified" boolean NOT NULL,
        "BankName" character varying(100),
        "ReviewNotes" character varying(2000),
        "RejectionReason" character varying(1000),
        "ReviewedByAdminId" uuid,
        "ReviewedAt" timestamp with time zone,
        "SubmittedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_organizer_verifications" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_organizer_verifications_organizers_OrganizerId" FOREIGN KEY ("OrganizerId") REFERENCES organizers ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_organizer_verifications_users_ReviewedByAdminId" FOREIGN KEY ("ReviewedByAdminId") REFERENCES users ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE INDEX "IX_audit_logs_Action" ON audit_logs ("Action");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE INDEX "IX_audit_logs_EntityType_EntityId" ON audit_logs ("EntityType", "EntityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE INDEX "IX_audit_logs_UserId" ON audit_logs ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE INDEX "IX_organizer_verifications_OrganizerId" ON organizer_verifications ("OrganizerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    CREATE INDEX "IX_organizer_verifications_ReviewedByAdminId" ON organizer_verifications ("ReviewedByAdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261005001425_AddOrganizerVerification') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261005001425_AddOrganizerVerification', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261006014103_AddSuspendedOrganizerStatus') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261006014103_AddSuspendedOrganizerStatus', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders DROP CONSTRAINT "FK_orders_events_EventId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders DROP CONSTRAINT "FK_orders_users_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "Status" TO status;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "UpdatedAt" TO updated_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "EventId" TO event_id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "UserId" TO user_id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "TotalAmount" TO total_amount;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER INDEX "IX_orders_UserId" RENAME TO "IX_orders_user_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER INDEX "IX_orders_EventId" RENAME TO "IX_orders_event_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE TABLE "Pagos" (
        "Id" uuid NOT NULL,
        "OrdenId" uuid NOT NULL,
        "Monto" numeric(10,2) NOT NULL,
        "MetodoPago" character varying(50) NOT NULL,
        "Estado" character varying(50) NOT NULL,
        "Fecha" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_Pagos" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Pagos_orders_OrdenId" FOREIGN KEY ("OrdenId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE TABLE "TiposBoleto" (
        "Id" uuid NOT NULL,
        "EventoId" uuid NOT NULL,
        "Nombre" character varying(100) NOT NULL,
        "Precio" numeric(10,2) NOT NULL,
        "CantidadDisponible" integer NOT NULL,
        "CantidadVendida" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_TiposBoleto" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TiposBoleto_events_EventoId" FOREIGN KEY ("EventoId") REFERENCES events ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE TABLE "OrdenDetalles" (
        "Id" uuid NOT NULL,
        "OrdenId" uuid NOT NULL,
        "TipoBoletoId" uuid NOT NULL,
        "Cantidad" integer NOT NULL,
        "PrecioUnitario" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_OrdenDetalles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrdenDetalles_TiposBoleto_TipoBoletoId" FOREIGN KEY ("TipoBoletoId") REFERENCES "TiposBoleto" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_OrdenDetalles_orders_OrdenId" FOREIGN KEY ("OrdenId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE INDEX "IX_OrdenDetalles_OrdenId" ON "OrdenDetalles" ("OrdenId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE INDEX "IX_OrdenDetalles_TipoBoletoId" ON "OrdenDetalles" ("TipoBoletoId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE UNIQUE INDEX "IX_Pagos_OrdenId" ON "Pagos" ("OrdenId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    CREATE INDEX "IX_TiposBoleto_EventoId" ON "TiposBoleto" ("EventoId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders ADD CONSTRAINT "FK_orders_events_event_id" FOREIGN KEY (event_id) REFERENCES events ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    ALTER TABLE orders ADD CONSTRAINT "FK_orders_users_user_id" FOREIGN KEY (user_id) REFERENCES users ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104054257_AgregarBoletosYPagos') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261104054257_AgregarBoletosYPagos', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261110034945_SincronizarModelo') THEN
    ALTER TABLE "Pagos" ADD "ReferenciaExterna" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261110034945_SincronizarModelo') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261110034945_SincronizarModelo', '8.0.11');
    END IF;
END $EF$;
COMMIT;

