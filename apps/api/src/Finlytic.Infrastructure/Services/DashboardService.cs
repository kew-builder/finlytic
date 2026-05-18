using Finlytic.Application.Common.DTOs.Dashboard;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Finlytic.Infrastructure.Services;

public sealed class DashboardService(
    AppDbContext db,
    IAiService aiService,
    ILogger<DashboardService> logger) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        Guid userId, DateOnly start, DateOnly end, CancellationToken ct = default)
    {
        // SELECT Type, SUM(Amount) FROM Transactions WHERE UserId=? AND TransactionDate BETWEEN ? AND ?
        // GROUP BY Type
        var totals = await db.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= start && t.TransactionDate <= end)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        var income = totals.FirstOrDefault(t => t.Type == TransactionType.Income)?.Total ?? 0m;
        var expenses = totals.FirstOrDefault(t => t.Type == TransactionType.Expense)?.Total ?? 0m;

        // Top expense category by spend in this period
        var topCategory = await db.Transactions
            .Where(t => t.UserId == userId
                && t.TransactionDate >= start
                && t.TransactionDate <= end
                && t.Type == TransactionType.Expense
                && t.CategoryId != null)
            .GroupBy(t => new { t.CategoryId, t.Category!.Name })
            .OrderByDescending(g => g.Sum(t => t.Amount))
            .Select(g => new { g.Key.Name, Total = g.Sum(t => t.Amount) })
            .FirstOrDefaultAsync(ct);

        return new DashboardSummaryResponse(income, expenses, income - expenses, topCategory?.Name, topCategory?.Total);
    }

    public async Task<IReadOnlyList<CategorySummaryResponse>> GetCategorySummaryAsync(
        Guid userId, DateOnly start, DateOnly end, CancellationToken ct = default)
    {
        var rows = await db.Transactions
            .Where(t => t.UserId == userId
                && t.TransactionDate >= start
                && t.TransactionDate <= end
                && t.Type == TransactionType.Expense)
            .GroupBy(t => new
            {
                t.CategoryId,
                CategoryName = t.Category != null ? t.Category.Name : "Uncategorized",
                CategoryColor = t.Category != null ? t.Category.Color : "#6b7280"
            })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                g.Key.CategoryColor,
                Total = g.Sum(t => t.Amount)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync(ct);

        var grandTotal = rows.Sum(r => r.Total);
        if (grandTotal == 0) return [];

        return rows.Select(r => new CategorySummaryResponse(
            r.CategoryId,
            r.CategoryName,
            r.CategoryColor,
            r.Total,
            Math.Round(r.Total / grandTotal * 100, 1)
        )).ToList();
    }

    public async Task<IReadOnlyList<SpendingTrendResponse>> GetTrendAsync(
        Guid userId, CancellationToken ct = default)
    {
        // Last 6 complete months (not including current partial month)
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-6);

        var rows = await db.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= cutoff)
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month, t.Type })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                g.Key.Type,
                Total = g.Sum(t => t.Amount)
            })
            .ToListAsync(ct);

        // Build a label for every month in the range (even empty months)
        var months = Enumerable.Range(0, 6)
            .Select(i => DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-5 + i))
            .Select(d => new { d.Year, d.Month })
            .ToList();

        return months.Select(m =>
        {
            var income = rows.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month && r.Type == TransactionType.Income)?.Total ?? 0m;
            var expenses = rows.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month && r.Type == TransactionType.Expense)?.Total ?? 0m;
            var date = new DateTime(m.Year, m.Month, 1);
            return new SpendingTrendResponse(m.Year, m.Month, date.ToString("MMM yyyy"), income, expenses);
        }).ToList();
    }

    public async Task<IReadOnlyList<BudgetVsActualResponse>> GetBudgetVsActualAsync(
        Guid userId, int year, int month, CancellationToken ct = default)
    {
        var startOfMonth = new DateOnly(year, month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        // Load all monthly budgets for this user with category info
        var budgets = await db.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Period == BudgetPeriod.Monthly)
            .ToListAsync(ct);

        if (budgets.Count == 0) return [];

        var categoryIds = budgets.Select(b => b.CategoryId).ToList();

        // Actual spending per category for this month
        var actuals = await db.Transactions
            .Where(t => t.UserId == userId
                && t.Type == TransactionType.Expense
                && t.TransactionDate >= startOfMonth
                && t.TransactionDate <= endOfMonth
                && t.CategoryId.HasValue
                && categoryIds.Contains(t.CategoryId!.Value))
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        return budgets.Select(b =>
        {
            var spent = actuals.FirstOrDefault(a => a.CategoryId == b.CategoryId)?.Total ?? 0m;
            var pct = b.Amount > 0 ? Math.Round(spent / b.Amount * 100, 1) : 0m;
            return new BudgetVsActualResponse(b.Id, b.CategoryId, b.Category.Name, b.Category.Color, b.Amount, spent, pct, spent > b.Amount);
        }).ToList();
    }

    public async Task<IReadOnlyList<ForecastResponse>> GetForecastAsync(
        Guid userId, CancellationToken ct = default)
    {
        var trend = await GetTrendAsync(userId, ct);

        if (trend.All(t => t.Income == 0 && t.Expenses == 0))
        {
            logger.LogInformation("No historical data for forecast for user {UserId}", userId);
            return [];
        }

        return await aiService.GenerateForecastAsync(trend, ct);
    }
}
