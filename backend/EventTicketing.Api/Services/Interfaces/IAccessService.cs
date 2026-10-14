using EventTicketing.Api.DTOs.Access;

namespace EventTicketing.Api.Services.Interfaces;

public interface IAccessService
{
    Task<TicketValidationResultDto> ValidateAndCheckInAsync(ValidateTicketDto dto);
}
