namespace EventTicketing.Api.DTOs.Organizers;

public class SubmitVerificationDto
{
    public string LegalName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string? ClabeAccount { get; set; }
    public string? CompanyDocumentUrl { get; set; }
}
