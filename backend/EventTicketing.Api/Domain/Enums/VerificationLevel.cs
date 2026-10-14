namespace EventTicketing.Api.Domain.Enums;

public enum VerificationLevel
{
    /// <summary>
    /// Cuenta registrada sin documentos. Solo puede crear borradores.
    /// </summary>
    Unverified = 0,

    /// <summary>
    /// Verificación básica: ID oficial + RFC/CURP + CLABE bancaria.
    /// Puede publicar eventos de hasta 500 personas.
    /// </summary>
    Basic = 1,

    /// <summary>
    /// Verificación PRO: empresa o persona con historial limpio de 3+ eventos.
    /// Puede publicar eventos de hasta 5,000 personas.
    /// </summary>
    Pro = 2,

    /// <summary>
    /// Acuerdo enterprise directo con Venú. Sin límites de capacidad.
    /// </summary>
    Enterprise = 3
}
