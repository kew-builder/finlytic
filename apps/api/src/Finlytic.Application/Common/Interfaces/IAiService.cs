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
    /// Categorizes multiple transactions in a single AI call (cheaper + faster than per-row calls).
    /// Result list is parallel to input list — null means AI could not categorize that row.
    /// </summary>
    Task<IReadOnlyList<AiCategorizationResult?>> CategorizeBatchAsync(
        IReadOnlyList<(string Description, decimal Amount, TransactionType Type)> transactions,
        CancellationToken ct = default);

    /// <summary>
    /// Generates financial insights from recent transactions.
    /// Returns empty list if AI is unavailable.
    /// </summary>
    Task<IReadOnlyList<AiInsight>> GenerateInsightsAsync(
        IReadOnlyList<TransactionResponse> transactions,
        CancellationToken ct = default);
}