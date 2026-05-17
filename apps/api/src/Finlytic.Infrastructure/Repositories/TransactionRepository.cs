using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Finlytic.Infrastructure.Repositories;

public sealed class TransactionRepository(AppDbContext db) : ITransactionRepository
{
    public async Task<Transaction?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default) =>
        await db.Transactions
            .Include(t => t.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct);

    public async Task<IReadOnlyList<Transaction>> GetByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        TransactionType? type = null,
        CancellationToken ct = default)
    {
        var query = db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId)
            .AsNoTracking();

        if (startDate.HasValue) query = query.Where(t => t.TransactionDate >= startDate.Value);
        if (endDate.HasValue)   query = query.Where(t => t.TransactionDate <= endDate.Value);
        if (type.HasValue)      query = query.Where(t => t.Type == type.Value);

        return await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default) =>
        await db.Transactions.AddAsync(transaction, ct);

    public void Update(Transaction transaction) =>
        db.Transactions.Update(transaction);

    public void Delete(Transaction transaction) =>
        db.Transactions.Remove(transaction);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
