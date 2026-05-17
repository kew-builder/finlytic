using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;

namespace Finlytic.Infrastructure.Services;

public sealed class TransactionService(ITransactionRepository repo) : ITransactionService
{
    public async Task<TransactionResponse> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var tx = await repo.GetByIdAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Transaction {id} not found.");
        return MapToResponse(tx);
    }

    public Task<IReadOnlyList<TransactionResponse>> GetByUserAsync(
        Guid userId, DateOnly? startDate, DateOnly? endDate, TransactionType? type, CancellationToken ct) =>
        repo.GetByUserAsync(userId, startDate, endDate, type, ct);

    public async Task<TransactionResponse> CreateAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct)
    {
        var tx = Transaction.Create(
            userId, request.Amount, request.Type,
            request.TransactionDate, request.Description, request.CategoryId);
        await repo.AddAsync(tx, ct);
        await repo.SaveChangesAsync(ct);
        return MapToResponse(tx);
    }

    public async Task<TransactionResponse> UpdateAsync(Guid id, Guid userId, UpdateTransactionRequest request, CancellationToken ct)
    {
        var tx = await repo.GetByIdAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Transaction {id} not found.");
        tx.Update(request.Amount, request.Type, request.TransactionDate, request.Description, request.CategoryId);
        repo.Update(tx);
        await repo.SaveChangesAsync(ct);
        return MapToResponse(tx);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var tx = await repo.GetByIdAsync(id, userId, ct)
            ?? throw new KeyNotFoundException($"Transaction {id} not found.");
        repo.Delete(tx);
        await repo.SaveChangesAsync(ct);
    }

    private static TransactionResponse MapToResponse(Transaction tx) => new(
        tx.Id,
        tx.Amount,
        tx.Type.ToString(),
        tx.Description,
        tx.TransactionDate,
        tx.CategoryId,
        tx.Category?.Name,
        tx.Category?.Color,
        tx.AiCategorized,
        tx.CreatedAt
    );
}
