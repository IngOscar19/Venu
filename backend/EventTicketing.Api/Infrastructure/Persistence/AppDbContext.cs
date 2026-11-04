// Infrastructure/Persistence/AppDbContext.cs
// Redirección y compatibilidad global: En este proyecto, el DbContext central es ApplicationDbContext.
global using AppDbContext = EventTicketing.Api.Data.ApplicationDbContext;
global using Orden = EventTicketing.Api.Domain.Entities.Order;
global using Boleto = EventTicketing.Api.Domain.Entities.Ticket;
