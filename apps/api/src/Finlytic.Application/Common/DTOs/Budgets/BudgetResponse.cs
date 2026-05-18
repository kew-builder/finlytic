namespace Finlytic.Application.Common.DTOs.Budgets;

public record BudgetResponse(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor,
    decimal Amount,
    string Period,
    DateOnly StartDate,
    DateOnly? EndDate
);
