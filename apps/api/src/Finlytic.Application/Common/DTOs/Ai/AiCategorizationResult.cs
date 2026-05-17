namespace Finlytic.Application.Common.DTOs.Ai;

public record AiCategorizationResult(
    string CategoryName,
    int Confidence,
    string Reasoning);