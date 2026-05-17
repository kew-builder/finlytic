using System.Collections.Concurrent;
using Finlytic.Application.Common.DTOs.Import;

namespace Finlytic.Infrastructure.Services;

// Singleton — holds in-memory job state.
// Trade-off: state lost on server restart. Acceptable for MVP personal use.
// Upgrade path: replace with Hangfire + DB-backed jobs when multi-user or persistence is needed.
public sealed class ImportJobStore
{
    private readonly ConcurrentDictionary<Guid, ImportJob> _jobs = new();

    public Guid Create(int totalRows)
    {
        var job = new ImportJob { Id = Guid.NewGuid(), Total = totalRows };
        _jobs[job.Id] = job;
        return job.Id;
    }

    public ImportJob? Get(Guid jobId) =>
        _jobs.TryGetValue(jobId, out var job) ? job : null;

    public void Update(Guid jobId, Action<ImportJob> mutate)
    {
        if (_jobs.TryGetValue(jobId, out var job))
            mutate(job);
    }

    public ImportJobResponse ToResponse(Guid jobId)
    {
        var job = Get(jobId);
        if (job is null)
            return new ImportJobResponse(jobId, "not_found", 0, 0, 0, 0, []);

        return new ImportJobResponse(
            job.Id, job.Status, job.Total,
            job.Processed, job.Imported, job.Failed,
            job.Errors.ToArray());
    }
}

public sealed class ImportJob
{
    public Guid Id { get; init; }
    public string Status { get; set; } = "queued";
    public int Total { get; set; }
    public int Processed { get; set; }
    public int Imported { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; } = [];
}
