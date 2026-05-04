namespace Finlytic.Domain.Entities;

public sealed class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public User User { get; private set; } = null!;

    private RefreshToken() { }

    public static RefreshToken Create(Guid userId, string token, int expiryDays) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Token = token,
        ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
        CreatedAt = DateTime.UtcNow
    };

    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
    public void Revoke() => IsRevoked = true;
}
