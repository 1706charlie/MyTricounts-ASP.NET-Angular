using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

public class SaveTricountDTOValidator : AbstractValidator<SaveTricountDTO>
{
    private readonly TricountContext _context;
    private readonly UserEntity _loggedUser;

    public SaveTricountDTOValidator(TricountContext context, UserEntity loggedUser) {
        _context = context;
        _loggedUser = loggedUser;

        // id entier nul ou positif
        RuleFor(t => t.Id) // on ne peut pas mettre NonEmpty car NonEmpty considère 0 comme empty
            .GreaterThanOrEqualTo(0);

        // Title : non vide (après trim) + longueur min 3 (après trim)
        RuleFor(t => t.Title)
            .NotEmpty()
            .DependentRules(() => {
                 RuleFor(t => t.Title)
                    .Must(s => (s ?? "").Trim().Length >= 3)
                    .WithMessage("Title must be at least 3 characters.");
             });

        // description si elle existe, longueur 3
        RuleFor(t => t.Description)
            .Must(s => string.IsNullOrWhiteSpace(s) || s.Trim().Length >= 3)
            .WithMessage("Description must be at least 3 characters.");

        // Participants : tous existent en BD
        RuleFor(t => t.Participants)
            .MustAsync(ParticipantsExist)
            .WithMessage("Participant not found.");

        // unicité du titre par créateur
        RuleFor(t => t) 
            .MustAsync(TitleUniquePerCreator)
            .WithMessage("Title must be unique per creator.");

        // partie update 
        When(t => t.Id > 0, () =>
        {
            RuleFor(t => t) // accès update: admin ou participant
                .MustAsync(UserCanUpdate)
                .WithMessage("Access denied");

            // le tricount doit exister
             RuleFor(t => t.Id)
                .MustAsync(TricountExists)
                .WithMessage("Tricount not found.");

            RuleFor(t => t.Participants)
                .NotEmpty()
                .WithMessage("Participants must not be empty.");

            // ne pas retirer le créateur
            RuleFor(t => t) 
                .MustAsync(CreatorNotRemoved)
                .WithMessage("You cannot remove the participation of the owner of a tricount.");

            // ne pas retirer un participant impliqué dans des opérations
            RuleFor(t => t) 
                .MustAsync(NoRemovalOfParticipantsInOperations)
                .WithMessage("You cannot remove a participant implied in operations for this tricount.");

            // ne pas retirer sa propre participation 
            RuleFor(t => t)
                .MustAsync(LoggedUserNotRemoved)
                .WithMessage("You cannot remove your own participation.");
        });

    }

    private async Task<bool> ParticipantsExist(IEnumerable<int> ids, CancellationToken token) 
    {
        var idList = ids.ToList();
        if (idList.Count == 0) return true;

        var existingIds = await UserEntity.GetExistingUserIds(_context, idList);
        var diff = idList.Except(existingIds).ToList();
        return diff.Count == 0;
    }

    private async Task<bool> TitleUniquePerCreator(SaveTricountDTO dto, CancellationToken token)
    {
        var title = (dto.Title ?? "").Trim().ToLower();
        int creatorId;

        if (dto.Id == 0)
        {
            // Création -> le créateur est l’utilisateur connecté
            creatorId = _loggedUser.Id;
        }
        else
        {
            // Update -> on récupère le creatorId du tricount existant
            var tricount = await _context.Tricounts
                .SingleOrDefaultAsync(t => t.Id == dto.Id, token);

            if (tricount == null)
                return true; // handled elsewhere

            creatorId = tricount.CreatorId;
        }

        // Vérifie unicité pour le même créateur
        return !await _context.Tricounts.AnyAsync(t =>
            t.CreatorId == creatorId &&
            t.Id != dto.Id &&
            t.Title != null &&
            t.Title.Trim().ToLower() == title,
            token);
    }
    
    private async Task<bool> TricountExists(int id, CancellationToken token)
    {
        return await _context.Tricounts.AnyAsync(t => t.Id == id, token);
    }
    
    private async Task<bool> UserCanUpdate(SaveTricountDTO dto, CancellationToken token)
    {
        if (_loggedUser.Role == Role.Admin)
            return true;

        return await _context.Participations
            .AnyAsync(p => p.TricountId == dto.Id && p.UserId == _loggedUser.Id, token);
    }

    private async Task<bool> CreatorNotRemoved(SaveTricountDTO dto, CancellationToken token)
    {
        var tricountInfo = await _context.Tricounts // on ne charge pas l'entité complète ici
            .Where(t => t.Id == dto.Id)
            .SingleOrDefaultAsync(token);

        // Si le tricount n'existe pas -> la règle ne s'occupe pas de ce cas
        if (tricountInfo == null)
            return true;

        // Le créateur doit être dans la nouvelle liste des participants
        return dto.Participants.Contains(tricountInfo.CreatorId);
    }

    private async Task<bool> NoRemovalOfParticipantsInOperations(SaveTricountDTO dto, CancellationToken token)
    {
        var currentUserIds = await _context.Participations
            .Where(p => p.TricountId == dto.Id)
            .Select(p => p.UserId)
            .ToListAsync(token);

        var desired = dto.Participants.ToHashSet();
        var toRemove = currentUserIds.Where(id => !desired.Contains(id)).ToList();
        if (!toRemove.Any()) return true;

        var involved = await _context.Repartitions
            .Where(r => r.Operation.TricountId == dto.Id && toRemove.Contains(r.UserId))
            .Select(r => r.UserId)
            .Distinct()
            .AnyAsync(token);

        return !involved;
    }

    private async Task<bool> LoggedUserNotRemoved(SaveTricountDTO dto, CancellationToken token)
    {
        var isParticipant = await _context.Participations
            .AnyAsync(p => p.TricountId == dto.Id && p.UserId == _loggedUser.Id, token);

        if (!isParticipant)
            return true;

        return dto.Participants.Contains(_loggedUser.Id);
    }
}
