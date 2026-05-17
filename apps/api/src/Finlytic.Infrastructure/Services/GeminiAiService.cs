using System.IO;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Finlytic.Application.Common.DTOs.Ai;
using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Ai;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly.CircuitBreaker;

namespace Finlytic.Infrastructure.Services;

public sealed class GeminiAiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly GeminiOptions _options;
    private readonly string _categorizePrompt;
    private readonly string _categorizeBatchPrompt;
    private readonly string _insightsPrompt;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public GeminiAiService(
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        ILogger<GeminiAiService> logger,
        IOptions<GeminiOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
        _options = options.Value;
        _categorizePrompt = LoadPrompt("categorize-v1.txt");
        _categorizeBatchPrompt = LoadPrompt("categorize-batch-v1.txt");
        _insightsPrompt = LoadPrompt("insights-v1.txt");
    }

    public async Task<AiCategorizationResult?> CategorizeAsync(
        string description, decimal amount, TransactionType type, CancellationToken ct = default)
    {
        // Normalize key so "Starbucks" and "starbucks" hit the same cache entry
        var cacheKey = $"categorize:{description.ToLowerInvariant().Trim()}:{type}";

        if (_cache.TryGetValue(cacheKey, out AiCategorizationResult? cached))
        {
            _logger.LogDebug("Cache hit for categorization: {Description}", description);
            return cached;
        }

        var prompt = _categorizePrompt
            .Replace("{description}", description)
            .Replace("{amount}", amount.ToString("F2"))
            .Replace("{type}", type.ToString());

        var raw = await CallGeminiAsync(prompt, maxTokens: 256, ct);
        if (raw is null) return null;

        try
        {
            var parsed = JsonSerializer.Deserialize<CategorizationAiResponse>(raw, JsonOpts);
            if (parsed is null) return null;

            var result = new AiCategorizationResult(parsed.Category, parsed.Confidence, parsed.Reasoning);

            // Cache 30 minutes — same description always categorizes the same way
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
            return result;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse categorization response. Raw: {Raw}", raw);
            return null;
        }
    }

    public async Task<IReadOnlyList<AiCategorizationResult?>> CategorizeBatchAsync(
        IReadOnlyList<(string Description, decimal Amount, TransactionType Type)> transactions,
        CancellationToken ct = default)
    {
        if (transactions.Count == 0) return [];

        // Build numbered list for the prompt
        var sb = new StringBuilder();
        for (var i = 0; i < transactions.Count; i++)
        {
            var (desc, amount, type) = transactions[i];
            sb.AppendLine($"{i + 1}. Description: {desc} | Amount: {amount:F2} | Type: {type}");
        }

        var prompt = _categorizeBatchPrompt.Replace("{transactions_list}", sb.ToString());

        // maxTokens: ~80 tokens per result × count, capped at 4096
        var maxTokens = Math.Min(transactions.Count * 80, 4096);
        var raw = await CallGeminiAsync(prompt, maxTokens, ct);
        if (raw is null) return Enumerable.Repeat<AiCategorizationResult?>(null, transactions.Count).ToList();

        try
        {
            var parsed = JsonSerializer.Deserialize<CategorizationAiResponse[]>(raw, JsonOpts);
            if (parsed is null) return Enumerable.Repeat<AiCategorizationResult?>(null, transactions.Count).ToList();

            // Map to result list; pad with null if AI returned fewer items than expected
            return Enumerable.Range(0, transactions.Count)
                .Select(i => i < parsed.Length
                    ? new AiCategorizationResult(parsed[i].Category, parsed[i].Confidence, parsed[i].Reasoning)
                    : null)
                .ToList<AiCategorizationResult?>();
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse batch categorization response. Raw: {Raw}", raw);
            return Enumerable.Repeat<AiCategorizationResult?>(null, transactions.Count).ToList();
        }
    }

    public async Task<IReadOnlyList<AiInsight>> GenerateInsightsAsync(
        IReadOnlyList<TransactionResponse> transactions, CancellationToken ct = default)
    {
        if (transactions.Count == 0) return [];

        var csv = BuildTransactionCsv(transactions);
        var prompt = _insightsPrompt.Replace("{transactions_csv}", csv);

        var raw = await CallGeminiAsync(prompt, maxTokens: 1024, ct);
        if (raw is null) return [];

        try
        {
            var parsed = JsonSerializer.Deserialize<InsightsAiResponse>(raw, JsonOpts);
            if (parsed?.Insights is null) return [];

            return parsed.Insights
                .Select(i => new AiInsight(i.Type, i.Title, i.Description, i.Amount))
                .ToList();
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse insights response. Raw: {Raw}", raw);
            return [];
        }
    }

    // Returns the raw JSON text from Gemini, or null on any failure (graceful degradation)
    private async Task<string?> CallGeminiAsync(string prompt, int maxTokens, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("Gemini");
        var endpoint = $"v1beta/models/{_options.Model}:generateContent?key={_options.ApiKey}";

        var requestBody = new GeminiRequest(
            [new GeminiContent([new GeminiPart(prompt)])],
            new GeminiGenerationConfig("application/json", maxTokens));

        HttpResponseMessage httpResponse;
        try
        {
            httpResponse = await client.PostAsJsonAsync(endpoint, requestBody, ct);
            httpResponse.EnsureSuccessStatusCode();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or BrokenCircuitException)
        {
            _logger.LogWarning(ex, "Gemini API unavailable — returning null for graceful degradation");
            return null;
        }

        GeminiResponse? geminiResponse;
        try
        {
            geminiResponse = await httpResponse.Content.ReadFromJsonAsync<GeminiResponse>(JsonOpts, ct);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Could not deserialize Gemini API response");
            return null;
        }

        _logger.LogInformation(
            "Gemini token usage — Prompt: {Prompt}, Output: {Output}, Total: {Total}",
            geminiResponse?.UsageMetadata?.PromptTokenCount,
            geminiResponse?.UsageMetadata?.CandidatesTokenCount,
            geminiResponse?.UsageMetadata?.TotalTokenCount);

        return geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
    }

    private static string BuildTransactionCsv(IReadOnlyList<TransactionResponse> transactions)
    {
        var sb = new StringBuilder("Date,Description,Category,Amount,Type\n");
        foreach (var t in transactions)
            sb.AppendLine($"{t.TransactionDate},{t.Description ?? ""},{t.CategoryName ?? ""},{t.Amount},{t.Type}");
        return sb.ToString();
    }

    private static string LoadPrompt(string filename)
    {
        var resourceName = $"Finlytic.Infrastructure.Ai.Prompts.{filename}";
        using var stream = typeof(GeminiAiService).Assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}