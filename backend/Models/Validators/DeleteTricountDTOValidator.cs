using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.Entities;
using TricountApp.Models.DTO;

public class DeleteTricountDTOValidator : AbstractValidator<DeleteTricountDTO>
{
    private readonly TricountContext _context;
    private readonly UserEntity _loggedUser;

    public DeleteTricountDTOValidator(TricountContext context, UserEntity loggedUser)
    {
        _context = context;
        _loggedUser = loggedUser;

        RuleFor(d => d.TricountId)
            .GreaterThan(0)
            .MustAsync(TricountExists)
            .WithMessage("Tricount not found.");

        // Accès: Admin = OK ; sinon, doit être le créateur du tricount
        RuleFor(d => d)
            .MustAsync(HasDeleteRight)
            .WithMessage("Access denied");
    }

    private Task<bool> TricountExists(int tricountId, CancellationToken token)
        => _context.Tricounts.AnyAsync(t => t.Id == tricountId, token);

    private async Task<bool> HasDeleteRight(DeleteTricountDTO dto, CancellationToken token)
    {
        if (_loggedUser.Role == Role.Admin) return true;

        var creatorId = await _context.Tricounts
            .Where(t => t.Id == dto.TricountId)
            .Select(t => t.CreatorId)
            .SingleOrDefaultAsync(token); // renvoie 0 si aucun enregistrement n'est trouvé

        if (creatorId == 0) return true;

        return creatorId == _loggedUser.Id;
    }
}