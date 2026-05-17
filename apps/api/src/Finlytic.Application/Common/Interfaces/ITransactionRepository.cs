using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.Interfaces;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<TransactionResponse>> GetByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        TransactionType? type = null,
        CancellationToken ct = default);
    Task AddAsync(Transaction transaction, CancellationToken ct = default);
    void Update(Transaction transaction);
    void Delete(Transaction transaction);
    Task SaveChangesAsync(CancellationToken ct = default);
}
