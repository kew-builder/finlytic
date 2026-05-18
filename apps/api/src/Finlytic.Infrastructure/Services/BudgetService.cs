using Finlytic.Application.Common.DTOs.Budgets;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Finlytic.Infrastructure.Services;

public sealed class BudgetService(
    IBudgetRepository repo,
    AppDbContext db,
    ILogger<BudgetService> logger) : IBudgetService
{
    public async Task<IReadOnlyList<BudgetResponse>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        var budgets = await repo.GetByUserAsync(userId, ct);
        return budgets.Select(MapToResponse).ToList();
    }

    public async Task<BudgetResponse> CreateAsync(Guid userId, CreateBudgetRequest req, CancellationToken ct = default)
    {
        if (!Enum.TryParse<BudgetPeriod>(req.Period, ignoreCase: true, out var period))
            throw new ArgumentException($"Invalid period '{req.Period}'. Valid values: Monthly, Yearly.");

        var categoryExists = await db.Categories
            .AnyAsync(c => c.Id == req.CategoryId && c.UserId == userId, ct);
        if (!categoryExists)
            throw new KeyNotFoundException($"Category {req.CategoryId} not found.");

        // One active budget per category+period to keep things simple
        var duplicate = await db.Budgets
            .AnyAsync(b => b.UserId == userId && b.CategoryId == req.CategoryId && b.Period == period, ct);
        if (duplicate)
            throw new InvalidOperationException($"A {period} budget for this category already exists.");

        var budget = Budget.Create(userId, req.CategoryId, req.Amount, period, req.StartDate, req.EndDate);
        await repo.AddAsync(budget, ct);

        logger.LogInformation("Budget created: {BudgetId} for user {UserId}", budget.Id, userId);

        // Reload with navigation to get category name/color
        var created = await repo.GetByIdAsync(budget.Id, userId, ct)
            ?? throw new InvalidOperationException("Budget was created but could not be reloaded.");
        return MapToResponse(created);
    }

    public async Task<BudgetResponse> UpdateAsync(Guid budgetId, Guid userId, UpdateBudgetRequest req, CancellationToken ct = default)
    {
        if (!Enum.TryParse<BudgetPeriod>(req.Period, ignoreCase: true, out var period))
            throw new ArgumentException($"Invalid period '{req.Period}'. Valid values: Monthly, Yearly.");

        var budget = await repo.GetByIdAsync(budgetId, userId, ct)
            ?? throw new KeyNotFoundException($"Budget {budgetId} not found.");

        budget.Update(req.Amount, period, req.StartDate, req.EndDate);
        await repo.UpdateAsync(budget, ct);

        return MapToResponse(budget);
    }

    public async Task DeleteAsync(Guid budgetId, Guid userId, CancellationToken ct = default)
    {
        var budget = await repo.GetByIdAsync(budgetId, userId, ct)
            ?? throw new KeyNotFoundException($"Budget {budgetId} not found.");

        await repo.DeleteAsync(budget, ct);
        logger.LogInformation("Budget deleted: {BudgetId} for user {UserId}", budgetId, userId);
    }

    private static BudgetResponse MapToResponse(Budget b) => new(
        b.Id,
        b.CategoryId,
        b.Category.Name,
        b.Category.Color,
        b.Amount,
        b.Period.ToString(),
        b.StartDate,
        b.EndDate
    );
}
