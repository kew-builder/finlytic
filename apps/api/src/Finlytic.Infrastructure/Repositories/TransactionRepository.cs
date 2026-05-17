using Finlytic.Application.Common.DTOs.Transactions;
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

    public async Task<IReadOnlyList<TransactionResponse>> GetByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        TransactionType? type = null,
        CancellationToken ct = default)
    {
        // AsNoTracking: ไม่ต้องการ change tracking สำหรับ read-only list
        // Select projection: โหลดเฉพาะ columns ที่ใช้ แทน Include ที่โหลด Category entity ทั้งก้อน
        // SQL ที่ได้: SELECT t.*, c.name, c.color FROM transactions LEFT JOIN categories
        // (ต่างจาก Include ที่ดึง c.id, c.icon, c.user_id, c.is_default, c.created_at ด้วย)
        var query = db.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        if (startDate.HasValue) query = query.Where(t => t.TransactionDate >= startDate.Value);
        if (endDate.HasValue)   query = query.Where(t => t.TransactionDate <= endDate.Value);
        if (type.HasValue)      query = query.Where(t => t.Type == type.Value);

        return await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionResponse(
                t.Id,
                t.Amount,
                t.Type.ToString(),
                t.Description,
                t.TransactionDate,
                t.CategoryId,
                t.Category == null ? null : t.Category.Name,
                t.Category == null ? null : t.Category.Color,
                t.AiCategorized,
                t.CreatedAt))
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
