using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.DTOs.Transactions;

public record UpdateTransactionRequest(
    decimal Amount,
    TransactionType Type,
    string? Description,
    DateOnly TransactionDate,
    Guid? CategoryId
);
