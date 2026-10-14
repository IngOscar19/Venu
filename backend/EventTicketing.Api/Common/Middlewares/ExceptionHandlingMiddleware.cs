using System.Net;
using EventTicketing.Api.Common.Exceptions;

namespace EventTicketing.Api.Common.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[UnhandledException] {ex}");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = ex switch
        {
            NotFoundException => (HttpStatusCode.NotFound, ex.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
            ValidationException => (HttpStatusCode.BadRequest, ex.Message),
            BusinessException => (HttpStatusCode.BadRequest, ex.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ex.Message),
            _ => (HttpStatusCode.InternalServerError, "Ocurrió un error interno en el servidor.")
        };

        context.Response.StatusCode = (int)statusCode;
        return context.Response.WriteAsJsonAsync(new { status = (int)statusCode, message });
    }
}
