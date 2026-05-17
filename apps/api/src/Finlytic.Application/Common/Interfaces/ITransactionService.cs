using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.Interfaces;

public interface ITransactionService
{
    Task<TransactionResponse> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<TransactionResponse>> GetByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        TransactionType? type = null,
        CancellationToken ct = default);
    Task<TransactionResponse> CreateAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct = default);
    Task<TransactionResponse> UpdateAsync(Guid id, Guid userId, UpdateTransactionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);
}
