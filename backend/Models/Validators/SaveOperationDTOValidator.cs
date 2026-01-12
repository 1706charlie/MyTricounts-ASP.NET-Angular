using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

public class SaveOperationDTOValidator : AbstractValidator<SaveOperationDTO>
{
    private readonly TricountContext _context;
    private readonly UserEntity _loggedUser;

    public SaveOperationDTOValidator(TricountContext context, UserEntity loggedUser) {
        _context = context;
        _loggedUser = loggedUser;

        // id entier nul ou positif
        RuleFor(o => o.Id) // on ne peut pas mettre NonEmpty car NonEmpty considère 0 comme empty
            .GreaterThanOrEqualTo(0);

        // le tricount doit exister
        RuleFor(o => o.TricountId)
            .GreaterThan(0)
            .MustAsync(TricountExists)
            .WithMessage("Tricount not found.");

        // Title : non vide (après trim) + longueur min 3 (après trim)
        RuleFor(o => o.Title)
            .NotEmpty()
            .DependentRules(() => {
                 RuleFor(t => t.Title)
                    .Must(s => (s ?? "").Trim().Length >= 3)
                    .WithMessage("Title must be at least 3 characters.");
             });

        // "le montant doit contenir un nombre décimal strictement positif et être exprimé en euros (≥ 0,01 €)"
        RuleFor(o => o.Amount) 
            .NotEmpty()
            .GreaterThanOrEqualTo(0.01m) // suffixe m = type decimal 
            .WithMessage("Amount must be at least 0.01€"); // on spécifie le message pour avoir la notion d'€ dans le message

        // "la date de l'opération ne peut pas être antérieure à la date de création du tricount associé, ni supérieure à la date du jour au moment de l'encodage."
        RuleFor(o => o)
            .MustAsync(OperationDateInRange)
            .WithMessage("Operation date must be on/after tricount creation and not in the future.");

        // "Il doit toujours y avoir au moins un participant impliqué dans une dépense"
        RuleFor(o => o.Repartitions)
            .NotEmpty();

        // Poids > 0 et participants distincts
        RuleFor(o => o.Repartitions)
            .Must(r => r.All(x => x.Weight > 0))
            .WithMessage("Weights must be strictly positive.");

        RuleFor(o => o.Repartitions.Select(x => x.UserId))
            .Must(ids => ids.Distinct().Count() == ids.Count())
            .WithMessage("Participants in repartitions must be distinct.");

        // Tous les participants des répartitions doivent appartenir au tricount
        RuleFor(o => o)
            .MustAsync(RepartitionUsersAreTricountParticipants)
            .WithMessage("All repartition users must be tricount participants.");

        // "l'initiateur du tricount doit être un des participants du tricount associé à cette dépense."
        RuleFor(o => o)
            .MustAsync(InitiatorIsParticipant)
            .WithMessage("Initiator must be a participant of the tricount.");

        RuleFor(o => o.OperationDate)
            .NotEmpty();

        RuleFor(o => o.InitiatorId)
            .NotEmpty();

        // accès save: admin ou participant
        RuleFor(o => o) 
            .MustAsync(UserCanSave)
            .WithMessage("Access denied");

        // partie update 
        When(o => o.Id > 0, () =>
        {
            // l'opération doit exister + l'opération doit appertenir au tricount
            RuleFor(o => o.Id)
                .MustAsync(OperationExists)
                .WithMessage("Operation not found.");

            RuleFor(o => o)
                .MustAsync(OperationBelongsToTricount)
                .WithMessage("Operation does not belong to the specified tricount.");
        });

    }

    private async Task<bool> TricountExists(int id, CancellationToken token)
    {
        return await _context.Tricounts.AnyAsync(t => t.Id == id, token);
    }

    private Task<bool> OperationExists(int id, CancellationToken token)
    {
        return _context.Operations.AnyAsync(o => o.Id == id, token);
    }

    private Task<bool> OperationBelongsToTricount(SaveOperationDTO dto, CancellationToken token)
    {
        return _context.Operations.AnyAsync(o => o.Id == dto.Id && o.TricountId == dto.TricountId, token);
    }

    private async Task<bool> UserCanSave(SaveOperationDTO dto, CancellationToken token)
    {
        if (_loggedUser.Role == Role.Admin)
            return true;

        return await _context.Participations
            .AnyAsync(p => p.TricountId == dto.TricountId && p.UserId == _loggedUser.Id, token);
    }

    private async Task<bool> OperationDateInRange(SaveOperationDTO dto, CancellationToken token)
    {
        var tricount = await _context.Tricounts
            .Where(t => t.Id == dto.TricountId)
            .Select(t => new { t.CreatedAt })
            .SingleOrDefaultAsync(token);

        if (tricount == null)
            return false;

        var opDate = dto.OperationDate;
        var minDate = DateOnly.FromDateTime(tricount.CreatedAt);
        var maxDate = DateOnly.FromDateTime(DateTime.Now);

        return opDate >= minDate && opDate <= maxDate;
    }

    private async Task<bool> RepartitionUsersAreTricountParticipants(SaveOperationDTO dto, CancellationToken token)
    {
        var participants = await _context.Participations
            .Where(p => p.TricountId == dto.TricountId)
            .Select(p => p.UserId)
            .ToListAsync(token);

        var participantSet = participants.ToHashSet();
        return dto.Repartitions.All(r => participantSet.Contains(r.UserId));
    }

    private async Task<bool> InitiatorIsParticipant(SaveOperationDTO dto, CancellationToken token)
    {
        if (dto.InitiatorId <= 0) return false;
        return await _context.Participations.AnyAsync(p => p.TricountId == dto.TricountId && p.UserId == dto.InitiatorId, token);
    }

}
