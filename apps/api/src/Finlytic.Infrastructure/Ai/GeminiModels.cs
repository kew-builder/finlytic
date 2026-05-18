using System.Text.Json.Serialization;

namespace Finlytic.Infrastructure.Ai;

// ---------- Request ----------

internal record GeminiRequest(
    [property: JsonPropertyName("contents")] GeminiContent[] Contents,
    [property: JsonPropertyName("generationConfig")] GeminiGenerationConfig GenerationConfig);

internal record GeminiContent(
    [property: JsonPropertyName("parts")] GeminiPart[] Parts);

internal record GeminiPart(
    [property: JsonPropertyName("text")] string Text);

internal record GeminiGenerationConfig(
    [property: JsonPropertyName("responseMimeType")] string ResponseMimeType,
    [property: JsonPropertyName("maxOutputTokens")] int MaxOutputTokens);

// ---------- Response ----------

internal record GeminiResponse(
    [property: JsonPropertyName("candidates")] GeminiCandidate[]? Candidates,
    [property: JsonPropertyName("usageMetadata")] GeminiUsageMetadata? UsageMetadata);

internal record GeminiCandidate(
    [property: JsonPropertyName("content")] GeminiContent? Content);

internal record GeminiUsageMetadata(
    [property: JsonPropertyName("promptTokenCount")] int PromptTokenCount,
    [property: JsonPropertyName("candidatesTokenCount")] int CandidatesTokenCount,
    [property: JsonPropertyName("totalTokenCount")] int TotalTokenCount);

// ---------- Parsed AI output ----------

internal record CategorizationAiResponse(
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("confidence")] int Confidence,
    [property: JsonPropertyName("reasoning")] string Reasoning);

internal record InsightsAiResponse(
    [property: JsonPropertyName("insights")] InsightItem[]? Insights);

internal record InsightItem(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("amount")] decimal? Amount);

internal record ForecastAiItem(
    [property: JsonPropertyName("year")] int Year,
    [property: JsonPropertyName("month")] int Month,
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("predictedIncome")] decimal PredictedIncome,
    [property: JsonPropertyName("predictedExpenses")] decimal PredictedExpenses,
    [property: JsonPropertyName("confidence")] int Confidence);
