namespace Finlytic.Application.Common.DTOs.Budgets;

public record CreateBudgetRequest(
    Guid CategoryId,
    decimal Amount,
    string Period,
    DateOnly StartDate,
    DateOnly? EndDate
);
