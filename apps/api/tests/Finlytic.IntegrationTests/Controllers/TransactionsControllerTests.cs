using Xunit;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Finlytic.Application.Common.DTOs.Transactions;
using FluentAssertions;

namespace Finlytic.IntegrationTests.Controllers;

public class TransactionsControllerTests : IClassFixture<WebAppFactory>
{
    private readonly HttpClient _client;
    private readonly WebAppFactory _factory;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public TransactionsControllerTests(WebAppFactory factory)
    {
        _factory = factory;
        _client  = factory.CreateClient();
    }

    private void Authorize() =>
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _factory.MakeToken());

    // ── Test 1 ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns401_WhenNoToken()
    {
        var response = await _client.GetAsync("/transactions");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Test 2 ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201_WithValidRequest()
    {
        Authorize();

        var body = new
        {
            amount          = 1500,
            type            = "Income",
            description     = "Integration test salary",
            transactionDate = "2026-05-01",
            categoryId      = (string?)null,
        };

        var response = await _client.PostAsJsonAsync("/transactions", body);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var created = await response.Content.ReadFromJsonAsync<TransactionResponse>(JsonOpts);
        created.Should().NotBeNull();
        created!.Amount.Should().Be(1500);
        created.Type.Should().Be("Income");
    }

    // ── Test 3 ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200_AndIncludesCreatedTransaction()
    {
        Authorize();

        // Create first
        var body = new
        {
            amount          = 350,
            type            = "Expense",
            description     = "Test expense for GetAll",
            transactionDate = "2026-05-03",
            categoryId      = (string?)null,
        };
        await _client.PostAsJsonAsync("/transactions", body);

        // Then fetch
        var response = await _client.GetAsync("/transactions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await response.Content.ReadFromJsonAsync<List<TransactionResponse>>(JsonOpts);
        list.Should().NotBeNull();
        list!.Should().Contain(t => t.Description == "Test expense for GetAll" && t.Amount == 350);
    }
}
