using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.Entities;

public class GetTricountBalanceDTOValidator : AbstractValidator<GetTricountBalanceDTO>
{
    private readonly TricountContext _context;
    private readonly UserEntity _loggedUser;

    public GetTricountBalanceDTOValidator(TricountContext context, UserEntity loggedUser) {
        _context = context;
        _loggedUser = loggedUser;

        RuleFor(d => d.TricountId)
            .GreaterThan(0);

        // le tricount doit exister
        RuleFor(d => d.TricountId)
            .MustAsync(TricountExists)
            .WithMessage("Tricount not found.");

        // droits d'accès
        RuleFor(d => d)
            .MustAsync(HasAccess)
            .WithMessage("Access denied");
    }

    private async Task<bool> TricountExists(int id, CancellationToken token)
    {
        return await _context.Tricounts.AnyAsync(t => t.Id == id, token);
    }

    private async Task<bool> HasAccess(GetTricountBalanceDTO dto, CancellationToken token)
    {
        if (_loggedUser.Role == Role.Admin) return true;

        return await _context.Participations
            .AnyAsync(p => p.TricountId == dto.TricountId
                        && p.UserId == _loggedUser.Id, token);
    }

}

