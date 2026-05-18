namespace Finlytic.Application.Common.DTOs.Dashboard;

public record ForecastResponse(
    int Year,
    int Month,
    string Label,
    decimal PredictedIncome,
    decimal PredictedExpenses,
    int Confidence
);
