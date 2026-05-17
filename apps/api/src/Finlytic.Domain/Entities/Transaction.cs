using Finlytic.Domain.Enums;

namespace Finlytic.Domain.Entities;

public sealed class Transaction
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? CategoryId { get; private set; }
    public decimal Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public string? Description { get; private set; }
    public DateOnly TransactionDate { get; private set; }
    public bool AiCategorized { get; private set; }
    public decimal? AiConfidence { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public User User { get; private set; } = null!;
    public Category? Category { get; private set; }

    private Transaction() { }

    public static Transaction Create(
        Guid userId, decimal amount, TransactionType type,
        DateOnly transactionDate, string? description = null, Guid? categoryId = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        CategoryId = categoryId,
        Amount = amount,
        Type = type,
        Description = description,
        TransactionDate = transactionDate,
        AiCategorized = false,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public void Update(decimal amount, TransactionType type, DateOnly transactionDate,
        string? description = null, Guid? categoryId = null)
    {
        Amount = amount;
        Type = type;
        Description = description;
        TransactionDate = transactionDate;
        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    // Called by AI service after categorization
    public void SetCategory(Guid categoryId, decimal confidence)
    {
        CategoryId = categoryId;
        AiCategorized = true;
        AiConfidence = confidence;
        UpdatedAt = DateTime.UtcNow;
    }
}
