namespace Finlytic.Infrastructure.Ai;

public sealed class GeminiOptions
{
    public const string Section = "Gemini";
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "gemini-1.5-flash";
}