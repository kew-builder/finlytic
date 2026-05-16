using Finlytic.Application.Common.DTOs.Auth;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finlytic.Api.Controllers;

// ⚠️  DEV-ONLY — every action checks IsDevelopment() and returns 404 in all other environments.
// Purpose: let frontend devs skip password auth during local development.
[ApiController]
[Route("auth")]
[AllowAnonymous]
public sealed class DevAuthController(
    IWebHostEnvironment env,
    AppDbContext db,
    IAuthService authService,
    ITokenService tokenService,
    IConfiguration config,
    ILogger<DevAuthController> logger) : ControllerBase
{
    /// <summary>
    /// [DEV ONLY] Returns a valid JWT for the given email without a password check.
    /// Creates the user automatically if they don't exist yet.
    /// Returns 404 in any non-Development environment.
    /// </summary>
    [HttpPost("dev-login")]
    public async Task<IActionResult> DevLogin([FromBody] DevLoginRequest request, CancellationToken ct)
    {
        if (!env.IsDevelopment())
            return NotFound();

        var email = request.Email.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            // Auto-register with a random unusable password so this user can only ever
            // authenticate via dev-login (BCrypt.Verify on a random string = always false).
            var burnerPassword = $"DevBypass-{Guid.NewGuid():N}!1Aa";
            var tokens = await authService.RegisterAsync(
                new RegisterRequest(email, burnerPassword, request.Name ?? "Dev User"), ct);

            logger.LogWarning("[DEV BYPASS] Auto-created dev user {Email}", email);
            return Ok(tokens);
        }

        var accessToken = tokenService.GenerateAccessToken(user);
        var rawRefreshToken = tokenService.GenerateRefreshToken();
        var expiryDays = int.Parse(config["Jwt:RefreshTokenExpiryDays"]!);

        db.RefreshTokens.Add(RefreshToken.Create(user.Id, rawRefreshToken, expiryDays));
        await db.SaveChangesAsync(ct);

        var expiresAt = DateTime.UtcNow.AddMinutes(int.Parse(config["Jwt:AccessTokenExpiryMinutes"]!));

        logger.LogWarning("[DEV BYPASS] Skipped password check for user {UserId}", user.Id);
        return Ok(new AuthResponse(accessToken, rawRefreshToken, expiresAt));
    }
}

public record DevLoginRequest(string Email, string? Name = null);