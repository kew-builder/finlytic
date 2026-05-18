using Finlytic.Domain.Entities;

namespace Finlytic.Application.Common.Interfaces;

public interface IBudgetRepository
{
    Task<IReadOnlyList<Budget>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<Budget?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<Budget> AddAsync(Budget budget, CancellationToken ct = default);
    Task UpdateAsync(Budget budget, CancellationToken ct = default);
    Task DeleteAsync(Budget budget, CancellationToken ct = default);
}
