using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Finlytic.Api.Controllers;

[ApiController]
[Route("insights")]
[Authorize]
public sealed class InsightsController(
    ITransactionService transactionService,
    IAiService aiService,
    IMemoryCache cache) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetInsights(CancellationToken ct)
    {
        var userId = GetUserId();
        var cacheKey = $"insights:{userId}";

        if (cache.TryGetValue(cacheKey, out object? cached))
            return Ok(cached);

        // Last 30 days of Expense transactions (enough for meaningful insights)
        var startDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        var transactions = await transactionService.GetByUserAsync(
            userId, startDate, endDate: null, type: TransactionType.Expense, ct);

        var insights = await aiService.GenerateInsightsAsync(transactions, ct);

        // Cache 1 hour — insights auto-refresh after user adds new transactions
        cache.Set(cacheKey, insights, TimeSpan.FromHours(1));

        return Ok(insights);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}
