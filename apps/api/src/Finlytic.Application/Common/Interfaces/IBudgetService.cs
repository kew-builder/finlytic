using Finlytic.Application.Common.DTOs.Budgets;

namespace Finlytic.Application.Common.Interfaces;

public interface IBudgetService
{
    Task<IReadOnlyList<BudgetResponse>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<BudgetResponse> CreateAsync(Guid userId, CreateBudgetRequest req, CancellationToken ct = default);
    Task<BudgetResponse> UpdateAsync(Guid budgetId, Guid userId, UpdateBudgetRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid budgetId, Guid userId, CancellationToken ct = default);
}
