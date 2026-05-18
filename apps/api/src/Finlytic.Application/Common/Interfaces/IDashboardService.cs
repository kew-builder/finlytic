using Finlytic.Application.Common.DTOs.Dashboard;

namespace Finlytic.Application.Common.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, DateOnly start, DateOnly end, CancellationToken ct = default);
    Task<IReadOnlyList<CategorySummaryResponse>> GetCategorySummaryAsync(Guid userId, DateOnly start, DateOnly end, CancellationToken ct = default);
    Task<IReadOnlyList<SpendingTrendResponse>> GetTrendAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<BudgetVsActualResponse>> GetBudgetVsActualAsync(Guid userId, int year, int month, CancellationToken ct = default);
    Task<IReadOnlyList<ForecastResponse>> GetForecastAsync(Guid userId, CancellationToken ct = default);
}
