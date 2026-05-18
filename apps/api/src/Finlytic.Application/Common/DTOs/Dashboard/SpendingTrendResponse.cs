namespace Finlytic.Application.Common.DTOs.Dashboard;

public record SpendingTrendResponse(
    int Year,
    int Month,
    string Label,
    decimal Income,
    decimal Expenses
);
