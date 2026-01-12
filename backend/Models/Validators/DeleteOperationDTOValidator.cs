using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

public class DeleteOperationDTOValidator : AbstractValidator<DeleteOperationDTO>
{
    private readonly TricountContext _context;
    private readonly UserEntity _loggedUser;

    public DeleteOperationDTOValidator(TricountContext context, UserEntity loggedUser)
    {
        _context = context;
        _loggedUser = loggedUser;

        RuleFor(d => d.Id)
            .GreaterThan(0)
            .MustAsync(OperationExists)
            .WithMessage("Operation not found.");

        // Accès: admin OK, sinon participant du tricount de l'opération
        RuleFor(d => d)
            .MustAsync(HasAccess)
            .WithMessage("Access denied");
    }

    private Task<bool> OperationExists(int id, CancellationToken ct) 
    {
        return _context.Operations.AnyAsync(o => o.Id == id, ct);
    }
        
    private async Task<bool> HasAccess(DeleteOperationDTO dto, CancellationToken ct)
    {
        if (_loggedUser.Role == Role.Admin) return true;

        // On récupère le tricount de l'opération
        var tricountId = await _context.Operations
            .Where(o => o.Id == dto.Id)
            .Select(o => o.TricountId)
            .SingleOrDefaultAsync(ct); // renvoie 0 si aucun enregistrement n'est trouvé

        if (tricountId == 0) return true;

        // Le user doit être participant de ce tricount
        return await _context.Participations
            .AnyAsync(p => p.TricountId == tricountId && p.UserId == _loggedUser.Id, ct);
    }
}