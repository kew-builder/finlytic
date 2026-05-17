using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.DTOs.Import;

public record ParsedTransactionRow(
    int RowNumber,
    DateOnly TransactionDate,
    string Description,
    decimal Amount,
    TransactionType Type);
