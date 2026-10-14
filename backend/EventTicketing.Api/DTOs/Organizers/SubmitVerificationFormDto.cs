using Microsoft.AspNetCore.Http;

namespace EventTicketing.Api.DTOs.Organizers;

public class SubmitVerificationFormDto
{
    public string LegalName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string? ClabeAccount { get; set; }
    public IFormFile? CompanyDocument { get; set; }
    public string? CompanyDocumentUrl { get; set; }
}
