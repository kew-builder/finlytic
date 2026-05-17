namespace Finlytic.Application.Common.DTOs.Auth;

public record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt);
