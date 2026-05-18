using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Finlytic.Infrastructure.Repositories;

public sealed class BudgetRepository(AppDbContext db) : IBudgetRepository
{
    public async Task<IReadOnlyList<Budget>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.Budgets
            .AsNoTracking()
            .Include(b => b.Category)
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.Category.Name)
            .ToListAsync(ct);

    public async Task<Budget?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default) =>
        await db.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct);

    public async Task<Budget> AddAsync(Budget budget, CancellationToken ct = default)
    {
        db.Budgets.Add(budget);
        await db.SaveChangesAsync(ct);
        return budget;
    }

    public async Task UpdateAsync(Budget budget, CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);

    public async Task DeleteAsync(Budget budget, CancellationToken ct = default)
    {
        db.Budgets.Remove(budget);
        await db.SaveChangesAsync(ct);
    }
}
