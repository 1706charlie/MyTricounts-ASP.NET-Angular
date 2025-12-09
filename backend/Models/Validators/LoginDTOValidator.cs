using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Helpers;

public class LoginDTOValidator : AbstractValidator<LoginDTO>
{
    private readonly TricountContext _context;

    public LoginDTOValidator(TricountContext context)
    {
        _context = context;

        RuleFor(d => d.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(d => d.Password)
            .NotEmpty().WithMessage("Password is required.");

        // Vérification des identifiants (email + mot de passe) 
        RuleFor(d => d)
            .MustAsync(CredentialsValid)
            .WithMessage("Incorrect email or password.");
    }

    private async Task<bool> CredentialsValid(LoginDTO dto, CancellationToken token)
    {
        var email = dto.Email.Trim().ToLower();
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email.ToLower() == email, token);
        if (user == null) return false;

        var hashed = TokenHelper.GetPasswordHash(dto.Password);
        return user.PasswordHash == hashed;
    }
}