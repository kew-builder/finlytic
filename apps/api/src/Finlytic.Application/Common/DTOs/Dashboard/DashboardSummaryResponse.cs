namespace Finlytic.Application.Common.DTOs.Dashboard;

public record DashboardSummaryResponse(
    decimal TotalIncome,
    decimal TotalExpenses,
    decimal Net,
    string? TopCategoryName,
    decimal? TopCategoryAmount
);
