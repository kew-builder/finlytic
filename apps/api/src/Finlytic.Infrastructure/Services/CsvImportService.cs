using System.Globalization;
using System.Text;
using Finlytic.Application.Common.DTOs.Import;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Finlytic.Infrastructure.Services;

public sealed class CsvImportService(
    AppDbContext db,
    IAiService aiService,
    ImportJobStore jobStore,
    ILogger<CsvImportService> logger) : ICsvImportService
{
    private static readonly string[] DateFormats =
        ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "d/M/yyyy"];

    public IReadOnlyList<ParsedTransactionRow> ParseCsv(Stream csvStream)
    {
        // Strip BOM so Thai bank exports (UTF-8 with BOM) parse correctly
        using var reader = new StreamReader(csvStream, detectEncodingFromByteOrderMarks: true);
        var lines = new List<string>();
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (!string.IsNullOrWhiteSpace(line))
                lines.Add(line);
        }

        if (lines.Count < 2)
            throw new InvalidOperationException("CSV must have a header row and at least one data row.");

        var separator = DetectSeparator(lines[0]);
        var headers = lines[0].Split(separator).Select(h => h.Trim().ToLowerInvariant()).ToArray();

        var dateIdx = FindColumn(headers, "date", "transaction_date", "txn_date", "วันที่");
        var descIdx = FindColumn(headers, "description", "desc", "detail", "memo", "รายการ");
        var amountIdx = FindColumn(headers, "amount", "จำนวนเงิน");
        var typeIdx = FindColumn(headers, "type", "ประเภท");

        // If no Type column, infer from Amount sign (negative = Expense, positive = Income)
        var inferType = typeIdx < 0;

        var rows = new List<ParsedTransactionRow>();
        for (var i = 1; i < lines.Count; i++)
        {
            var cols = lines[i].Split(separator);
            if (cols.Length <= Math.Max(dateIdx, Math.Max(descIdx, amountIdx)))
                continue;

            if (!DateOnly.TryParseExact(cols[dateIdx].Trim(), DateFormats,
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                throw new InvalidOperationException($"Row {i + 1}: cannot parse date '{cols[dateIdx]}'.");

            if (!decimal.TryParse(cols[amountIdx].Trim().Replace(",", ""),
                    NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                throw new InvalidOperationException($"Row {i + 1}: cannot parse amount '{cols[amountIdx]}'.");

            TransactionType type;
            if (inferType)
            {
                type = amount < 0 ? TransactionType.Expense : TransactionType.Income;
                amount = Math.Abs(amount);
            }
            else
            {
                var typeStr = cols[typeIdx].Trim().ToLowerInvariant();
                type = typeStr is "income" or "รายรับ" ? TransactionType.Income : TransactionType.Expense;
            }

            rows.Add(new ParsedTransactionRow(
                i,
                date,
                descIdx >= 0 && descIdx < cols.Length ? cols[descIdx].Trim() : "",
                amount,
                type));
        }

        return rows;
    }

    public async Task ProcessImportAsync(
        Guid jobId, IReadOnlyList<ParsedTransactionRow> rows, Guid userId, CancellationToken ct = default)
    {
        jobStore.Update(jobId, j => j.Status = "processing");
        logger.LogInformation("Import job {JobId} started — {Count} rows", jobId, rows.Count);

        try
        {
            // Load user's categories once for matching AI output
            var categories = await db.Categories
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .ToListAsync(ct);

            // Batch categorize all rows in one AI call (much cheaper than per-row)
            var inputs = rows
                .Select(r => (r.Description, r.Amount, r.Type))
                .ToList();

            var aiResults = await aiService.CategorizeBatchAsync(inputs, ct);

            var transactions = new List<Transaction>(rows.Count);
            for (var i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                var aiResult = i < aiResults.Count ? aiResults[i] : null;

                Guid? categoryId = null;
                if (aiResult is not null)
                {
                    var matched = categories.FirstOrDefault(c =>
                        string.Equals(c.Name, aiResult.CategoryName, StringComparison.OrdinalIgnoreCase));
                    categoryId = matched?.Id;
                }

                var tx = Transaction.Create(userId, row.Amount, row.Type, row.TransactionDate, row.Description, categoryId);

                if (aiResult is not null && categoryId.HasValue)
                    tx.SetCategory(categoryId.Value, aiResult.Confidence);

                transactions.Add(tx);
            }

            await db.Transactions.AddRangeAsync(transactions, ct);
            await db.SaveChangesAsync(ct);

            jobStore.Update(jobId, j =>
            {
                j.Status = "completed";
                j.Processed = rows.Count;
                j.Imported = transactions.Count;
                j.Failed = 0;
            });

            logger.LogInformation("Import job {JobId} completed — {Imported}/{Total} imported",
                jobId, transactions.Count, rows.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Import job {JobId} failed", jobId);
            jobStore.Update(jobId, j =>
            {
                j.Status = "failed";
                j.Errors.Add(ex.Message);
            });
        }
    }

    private static char DetectSeparator(string header)
    {
        if (header.Contains(';')) return ';';
        if (header.Contains('\t')) return '\t';
        return ',';
    }

    private static int FindColumn(string[] headers, params string[] candidates)
    {
        foreach (var c in candidates)
        {
            var idx = Array.IndexOf(headers, c);
            if (idx >= 0) return idx;
        }
        return -1;
    }
}
