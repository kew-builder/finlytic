using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Finlytic.Application.Common.DTOs.Transactions;
using Finlytic.Application.Common.Interfaces;
using Finlytic.Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finlytic.Api.Controllers;

[ApiController]
[Route("transactions")]
[Authorize]
public sealed class TransactionsController(
    ITransactionService service,
    IAiService aiService,
    IValidator<CreateTransactionRequest> createValidator,
    IValidator<UpdateTransactionRequest> updateValidator) : ControllerBase
{
    [HttpPost("suggest")]
    public async Task<IActionResult> SuggestCategory(
        [FromBody] SuggestCategoryRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Length < 2)
            return BadRequest(new { error = "Description too short to suggest a category." });

        var result = await aiService.CategorizeAsync(
            request.Description, request.Amount, request.Type, ct);

        if (result is null)
            return Ok(new { categoryName = (string?)null, confidence = 0 });

        return Ok(new { categoryName = result.CategoryName, confidence = result.Confidence });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] TransactionType? type,
        CancellationToken ct)
    {
        var transactions = await service.GetByUserAsync(GetUserId(), startDate, endDate, type, ct);
        return Ok(transactions);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var tx = await service.GetByIdAsync(id, GetUserId(), ct);
            return Ok(tx);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request, CancellationToken ct)
    {
        var result = await createValidator.ValidateAsync(request, ct);
        if (!result.IsValid)
            return BadRequest(new { errors = result.Errors.Select(e => e.ErrorMessage) });

        var tx = await service.CreateAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = tx.Id }, tx);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTransactionRequest request, CancellationToken ct)
    {
        var result = await updateValidator.ValidateAsync(request, ct);
        if (!result.IsValid)
            return BadRequest(new { errors = result.Errors.Select(e => e.ErrorMessage) });

        try
        {
            var tx = await service.UpdateAsync(id, GetUserId(), request, ct);
            return Ok(tx);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await service.DeleteAsync(id, GetUserId(), ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}
