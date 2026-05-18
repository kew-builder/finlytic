using Finlytic.Domain.Enums;

namespace Finlytic.Domain.Entities;

public sealed class Category
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public TransactionType Type { get; private set; }
    public string Color { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public User User { get; private set; } = null!;

    private readonly List<Transaction> _transactions = [];
    private readonly List<Budget> _budgets = [];
    public IReadOnlyList<Transaction> Transactions => _transactions.AsReadOnly();
    public IReadOnlyList<Budget> Budgets => _budgets.AsReadOnly();

    private Category() { }

    public static Category Create(Guid userId, string name, TransactionType type, string color, bool isDefault = false) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Type = type,
        Color = color,
        IsDefault = isDefault,
        CreatedAt = DateTime.UtcNow
    };

    public void Update(string name, string color)
    {
        Name = name;
        Color = color;
    }
}
