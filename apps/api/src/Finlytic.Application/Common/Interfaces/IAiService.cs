using Finlytic.Application.Common.DTOs.Ai;
using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Domain.Enums;

namespace Finlytic.Application.Common.Interfaces;

public interface IAiService
{
    /// <summary>
    /// Suggests a category for a transaction based on its description and amount.
    /// Returns null if AI is unavailable (circuit breaker open).
    /// </summary>
    Task<AiCategorizationResult?> CategorizeAsync(
        string description,
        decimal amount,
        TransactionType type,
        CancellationToken ct = default);

    /// <summary>
    /// Generates financial insights from recent transactions.
    /// Returns empty list if AI is unavailable.
    /// </summary>
    Task<IReadOnlyList<AiInsight>> GenerateInsightsAsync(
        IReadOnlyList<TransactionResponse> transactions,
        CancellationToken ct = default);
}