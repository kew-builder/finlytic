using Finlytic.Application.Common.DTOs.Transactions;
using FluentValidation;

namespace Finlytic.Application.Common.Validators;

public sealed class CreateTransactionRequestValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Type must be Income or Expense.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .Must(d => !d!.Contains('<')).WithMessage("Description must not contain HTML.")
            .When(x => x.Description is not null);

        RuleFor(x => x.TransactionDate)
            .NotEmpty().WithMessage("Transaction date is required.")
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)))
            .WithMessage("Transaction date cannot be in the future.");
    }
}
