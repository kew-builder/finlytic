using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finlytic.Api.Controllers;

[ApiController]
[Route("import")]
[Authorize]
public sealed class ImportController(
    ICsvImportService csvImportService,
    ImportJobStore jobStore,
    IServiceScopeFactory scopeFactory,
    ILogger<ImportController> logger) : ControllerBase
{
    [HttpPost("csv")]
    public IActionResult UploadCsv(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only .csv files are accepted." });

        if (file.Length > 5 * 1024 * 1024) // 5 MB cap
            return BadRequest(new { error = "File exceeds 5 MB limit." });

        IReadOnlyList<Finlytic.Application.Common.DTOs.Import.ParsedTransactionRow> rows;
        try
        {
            using var stream = file.OpenReadStream();
            rows = csvImportService.ParseCsv(stream);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        if (rows.Count == 0)
            return BadRequest(new { error = "CSV contains no valid data rows." });

        var userId = GetUserId();
        var jobId = jobStore.Create(rows.Count);

        // Fire-and-forget in background scope so DbContext lifecycle is correct
        _ = Task.Run(async () =>
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<ICsvImportService>();
            await service.ProcessImportAsync(jobId, rows, userId);
        });

        logger.LogInformation("CSV upload accepted — JobId: {JobId}, Rows: {Rows}, UserId: {UserId}",
            jobId, rows.Count, userId);

        return Accepted(new { jobId, rowCount = rows.Count, statusUrl = $"/import/jobs/{jobId}" });
    }

    [HttpGet("jobs/{jobId:guid}")]
    public IActionResult GetJobStatus(Guid jobId)
    {
        var response = jobStore.ToResponse(jobId);
        if (response.Status == "not_found")
            return NotFound(new { error = "Job not found." });

        return Ok(response);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}
