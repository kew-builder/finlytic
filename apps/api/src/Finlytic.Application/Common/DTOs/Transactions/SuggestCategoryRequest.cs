using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.DTOs.Transactions;

public record SuggestCategoryRequest(
    string Description,
    decimal Amount,
    TransactionType Type);
