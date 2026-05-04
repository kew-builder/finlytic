namespace Finlytic.Application.Common.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string Name);
