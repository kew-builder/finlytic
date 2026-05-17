namespace Finlytic.Application.Common.DTOs.Ai;

public record AiInsight(
    string Type,        // "overspending" | "trend" | "anomaly" | "saving_opportunity"
    string Title,
    string Description,
    decimal? Amount);