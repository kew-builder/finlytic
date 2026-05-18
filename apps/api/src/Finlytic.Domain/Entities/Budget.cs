using Finlytic.Domain.Enums;

namespace Finlytic.Domain.Entities;

public sealed class Budget
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid CategoryId { get; private set; }
    public decimal Amount { get; private set; }
    public BudgetPeriod Period { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public User User { get; private set; } = null!;
    public Category Category { get; private set; } = null!;

    private Budget() { }

    public static Budget Create(Guid userId, Guid categoryId, decimal amount, BudgetPeriod period, DateOnly startDate, DateOnly? endDate = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        CategoryId = categoryId,
        Amount = amount,
        Period = period,
        StartDate = startDate,
        EndDate = endDate,
        CreatedAt = DateTime.UtcNow
    };

    public void Update(decimal amount, BudgetPeriod period, DateOnly startDate, DateOnly? endDate)
    {
        Amount = amount;
        Period = period;
        StartDate = startDate;
        EndDate = endDate;
    }
}
