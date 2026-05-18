namespace Finlytic.Application.Common.DTOs.Transactions;

public record TransactionResponse(
    Guid Id,
    decimal Amount,
    string Type,
    string? Description,
    DateOnly TransactionDate,
    Guid? CategoryId,
    string? CategoryName,
    string? CategoryColor,
    bool AiCategorized,
    DateTime CreatedAt
);
