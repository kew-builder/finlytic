namespace Finlytic.Application.Common.DTOs.Dashboard;

public record BudgetVsActualResponse(
    Guid BudgetId,
    Guid CategoryId,
    string CategoryName,
    string CategoryColor,
    decimal BudgetAmount,
    decimal ActualSpent,
    decimal Percentage,
    bool IsOverBudget
);
