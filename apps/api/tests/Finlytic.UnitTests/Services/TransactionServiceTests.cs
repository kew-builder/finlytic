using FluentAssertions;
using Xunit;
using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;
using Finlytic.Infrastructure.Services;
using Moq;

namespace Finlytic.UnitTests.Services;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _repo = new();
    private readonly TransactionService _svc;

    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.Today);

    public TransactionServiceTests() => _svc = new TransactionService(_repo.Object);

    private static Transaction MakeTx() =>
        Transaction.Create(UserId, 500m, TransactionType.Expense, Today, "Test expense", null);

    private static TransactionResponse MakeResponse(Guid id) =>
        new(id, 500m, "Expense", "Test expense", Today, null, null, null, false, DateTime.UtcNow);

    // ── GetByIdAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_ReturnsResponse_WhenFound()
    {
        var tx = MakeTx();
        _repo.Setup(r => r.GetByIdAsync(tx.Id, UserId, default)).ReturnsAsync(tx);

        var result = await _svc.GetByIdAsync(tx.Id, UserId);

        result.Id.Should().Be(tx.Id);
        result.Amount.Should().Be(500m);
        result.Type.Should().Be("Expense");
    }

    [Fact]
    public async Task GetByIdAsync_ThrowsKeyNotFoundException_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id, UserId, default)).ReturnsAsync((Transaction?)null);

        var act = () => _svc.GetByIdAsync(id, UserId);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"*{id}*");
    }

    // ── GetByUserAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetByUserAsync_DelegatesFiltersToRepository()
    {
        var startDate = new DateOnly(2026, 5, 1);
        var endDate   = new DateOnly(2026, 5, 31);
        var expected  = new List<TransactionResponse> { MakeResponse(Guid.NewGuid()) };

        _repo.Setup(r => r.GetByUserAsync(UserId, startDate, endDate, TransactionType.Expense, default))
             .ReturnsAsync(expected);

        var result = await _svc.GetByUserAsync(UserId, startDate, endDate, TransactionType.Expense, default);

        result.Should().BeEquivalentTo(expected);
        _repo.Verify(r => r.GetByUserAsync(UserId, startDate, endDate, TransactionType.Expense, default), Times.Once);
    }

    // ── CreateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_AddsAndSavesTransaction_ReturnsResponse()
    {
        var request = new CreateTransactionRequest(1200m, TransactionType.Income, "Salary", Today, null);

        var result = await _svc.CreateAsync(UserId, request, default);

        result.Amount.Should().Be(1200m);
        result.Type.Should().Be("Income");
        result.AiCategorized.Should().BeFalse();

        _repo.Verify(r => r.AddAsync(
            It.Is<Transaction>(t => t.Amount == 1200m && t.UserId == UserId), default), Times.Once);
        _repo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    // ── UpdateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFoundException_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id, UserId, default)).ReturnsAsync((Transaction?)null);

        var request = new UpdateTransactionRequest(100m, TransactionType.Expense, null, Today, null);
        var act = () => _svc.UpdateAsync(id, UserId, request, default);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesAndReturnsResponse_WhenFound()
    {
        var tx = MakeTx();
        _repo.Setup(r => r.GetByIdAsync(tx.Id, UserId, default)).ReturnsAsync(tx);

        var request = new UpdateTransactionRequest(999m, TransactionType.Income, "Updated", Today, null);
        var result = await _svc.UpdateAsync(tx.Id, UserId, request, default);

        result.Amount.Should().Be(999m);
        result.Type.Should().Be("Income");
        _repo.Verify(r => r.Update(tx), Times.Once);
        _repo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    // ── DeleteAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFoundException_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id, UserId, default)).ReturnsAsync((Transaction?)null);

        var act = () => _svc.DeleteAsync(id, UserId, default);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_DeletesAndSavesChanges_WhenFound()
    {
        var tx = MakeTx();
        _repo.Setup(r => r.GetByIdAsync(tx.Id, UserId, default)).ReturnsAsync(tx);

        await _svc.DeleteAsync(tx.Id, UserId, default);

        _repo.Verify(r => r.Delete(tx), Times.Once);
        _repo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }
}
