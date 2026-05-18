namespace Finlytic.Application.Common.DTOs.Dashboard;

public record CategorySummaryResponse(
    Guid? CategoryId,
    string CategoryName,
    string CategoryColor,
    decimal Total,
    decimal Percentage
);
