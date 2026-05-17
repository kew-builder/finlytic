namespace Finlytic.Application.Common.DTOs.Import;

public record ImportJobResponse(
    Guid JobId,
    string Status,      // queued | processing | completed | failed
    int Total,
    int Processed,
    int Imported,
    int Failed,
    IReadOnlyList<string> Errors);
