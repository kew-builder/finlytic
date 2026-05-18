using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Finlytic.Application.Common.DTOs.Budgets;
using Finlytic.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finlytic.Api.Controllers;

[ApiController]
[Route("budgets")]
[Authorize]
public sealed class BudgetsController(IBudgetService budgetService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var budgets = await budgetService.GetAllAsync(GetUserId(), ct);
        return Ok(budgets);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetRequest req, CancellationToken ct)
    {
        try
        {
            var created = await budgetService.CreateAsync(GetUserId(), req, ct);
            return CreatedAtAction(nameof(GetAll), created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBudgetRequest req, CancellationToken ct)
    {
        try
        {
            var updated = await budgetService.UpdateAsync(id, GetUserId(), req, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await budgetService.DeleteAsync(id, GetUserId(), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}
