using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;

public class SignupDTOValidator : AbstractValidator<SignupDTO>
{
    private readonly TricountContext _context;

    public SignupDTOValidator(TricountContext context)
    {
        _context = context;

        // ------------------------------------
        // EMAIL
        // ------------------------------------
        RuleFor(d => d.Email)
            .NotEmpty()
            .EmailAddress()
            .MustAsync(EmailAvailable).WithMessage("Email is already in use.");

        // ------------------------------------
        // FULL NAME
        // ------------------------------------
        RuleFor(d => d.FullName)
            .NotEmpty()
            .Must(name => name.Trim().Length >= 3)
            .WithMessage("Full name must be at least 3 characters.")
            .MustAsync(FullNameAvailable).WithMessage("Full name is already in use.");

        // ------------------------------------
        // PASSWORD
        // ------------------------------------
        RuleFor(d => d.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@".*\d").WithMessage("Password must contain at least one digit.")
            .Matches(@".*[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@".*[^a-zA-Z0-9]").WithMessage("Password must contain at least one non-alphanumeric character.");

        // ------------------------------------
        // IBAN (optionnel)
        // ------------------------------------
        RuleFor(d => d.Iban)
            .Matches(@"^[A-Z]{2}\d{2}(?: \d{4}){3}$")
            .WithMessage("IBAN must match the pattern 'AA99 9999 9999 9999'.")
            .When(d => !string.IsNullOrWhiteSpace(d.Iban));
    }


    private async Task<bool> EmailAvailable(string email, CancellationToken token)
    {
        email = email.Trim().ToLower();

        return !await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email, token);
    }

    private async Task<bool> FullNameAvailable(string fullName, CancellationToken token)
    {
        fullName = fullName.Trim().ToLower();

        return !await _context.Users
            .AnyAsync(u => u.Name.ToLower() == fullName, token);
    }
}