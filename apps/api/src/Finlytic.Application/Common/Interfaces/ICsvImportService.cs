using Finlytic.Application.Common.DTOs.Import;

namespace Finlytic.Application.Common.Interfaces;

public interface ICsvImportService
{
    /// <summary>
    /// Parses and validates a CSV stream. Returns parsed rows or throws on malformed file.
    /// </summary>
    IReadOnlyList<ParsedTransactionRow> ParseCsv(Stream csvStream);

    /// <summary>
    /// Processes a pre-parsed import job: AI categorize + bulk save + update job status.
    /// Designed to run in background via Task.Run.
    /// </summary>
    Task ProcessImportAsync(
        Guid jobId,
        IReadOnlyList<ParsedTransactionRow> rows,
        Guid userId,
        CancellationToken ct = default);
}
