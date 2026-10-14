namespace EventTicketing.Api.Domain.Enums;

public enum OrganizerStatus
{
    PENDING,    // Recién registrado, sin verificar
    VERIFIED,   // Verificado y activo
    REJECTED,   // Documentos rechazados
    SUSPENDED   // Suspendido por comportamiento sospechoso o fraude
}