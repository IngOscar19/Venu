namespace EventTicketing.Api.Common.Exceptions;

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

public class NotFoundException : KeyNotFoundException
{
    public NotFoundException(string message) : base(message) { }
}
