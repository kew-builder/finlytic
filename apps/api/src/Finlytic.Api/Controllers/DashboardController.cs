using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Finlytic.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Finlytic.Api.Controllers;

[ApiController]
[Route("dashboard")]
[Authorize]
public sealed class DashboardController(
    IDashboardService dashboardService,
    IMemoryCache cache) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = startDate ?? new DateOnly(today.Year, today.Month, 1);
        var end = endDate ?? today;

        var result = await dashboardService.GetSummaryAsync(userId, start, end, ct);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = startDate ?? new DateOnly(today.Year, today.Month, 1);
        var end = endDate ?? today;

        var result = await dashboardService.GetCategorySummaryAsync(userId, start, end, ct);
        return Ok(result);
    }

    [HttpGet("trend")]
    public async Task<IActionResult> GetTrend(CancellationToken ct)
    {
        var result = await dashboardService.GetTrendAsync(GetUserId(), ct);
        return Ok(result);
    }

    [HttpGet("budget-vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var result = await dashboardService.GetBudgetVsActualAsync(
            GetUserId(),
            year ?? now.Year,
            month ?? now.Month,
            ct);
        return Ok(result);
    }

    [HttpGet("forecast")]
    public async Task<IActionResult> GetForecast(CancellationToken ct)
    {
        var userId = GetUserId();
        var cacheKey = $"forecast:{userId}";

        if (cache.TryGetValue(cacheKey, out object? cached))
            return Ok(cached);

        var result = await dashboardService.GetForecastAsync(userId, ct);

        // Forecast changes slowly — cache 6 hours
        cache.Set(cacheKey, result, TimeSpan.FromHours(6));

        return Ok(result);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}
