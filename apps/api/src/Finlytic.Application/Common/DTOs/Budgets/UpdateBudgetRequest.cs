namespace Finlytic.Application.Common.DTOs.Budgets;

public record UpdateBudgetRequest(
    decimal Amount,
    string Period,
    DateOnly StartDate,
    DateOnly? EndDate
);
