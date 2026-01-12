using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models.DTO;

namespace TricountApp.Models.Entities;

public class TricountEntity {
    private readonly TricountContext? _context;

    // constructeur vide
    public TricountEntity() { }

    // constructeur qui prend en paramètre le contexte
    public TricountEntity(TricountContext context) {
        this._context = context;
    }

    [Key]
    public int Id { get; set;} // EF Core va auto-incrémenter Id automatiquement
    public string Title { get; set;} = null!;
    public string? Description { get; set;} = null;
    public int CreatorId { get; set; } // FK vers l'utilisateur creator
    public UserEntity Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Date/heure de création en base  
    
    /// <summary>Participants associés à ce tricount.</summary>
    public ICollection<UserEntity> Participants { get; set; } = new HashSet<UserEntity>();

    /// <summary>Participations pour ce tricount.</summary>
    public ICollection<ParticipationEntity> Participations { get; set; } = new HashSet<ParticipationEntity>();
    
    /// <summary>Opérations enregistrées dans ce tricount.</summary>
    public ICollection<OperationEntity> Operations { get; set; } = new HashSet<OperationEntity>();




    /// <summary>Récuperer les tricounts.</summary>
    public static async Task<List<TricountEntity>> GetMyTricounts(TricountContext context, int userId, bool isAdmin) {

        IQueryable<TricountEntity> query = context.Tricounts
            .AsNoTracking()
            .Include(t => t.Participants)
            .Include(t => t.Operations)
                .ThenInclude(o => o.Repartitions.OrderBy(r => r.UserId))
            .OrderByDescending(t => t.CreatedAt); 

        // Si ce n'est pas un admin, on filtre sur ses participations
        // Si c’est un admin, on ne filtre pas : il voit tous les tricounts
        if (!isAdmin)
            query = query.Where(t => t.Participations.Any(p => p.UserId == userId));
        
        return await query.ToListAsync();
    }

    /// <summary>
    /// Calcule, pour un tricount donné, la balance de chaque participant :
    /// - Paid   : ce qu'il a payé (sommes des opérations dont il est initiateur)
    /// - Due    : ce qu'il devait (parts calculées via les poids des répartitions)
    /// - Balance: Paid - Due
    /// </summary>
    public static async Task<List<TricountBalanceDTO>> ComputeBalances(TricountContext context, TricountEntity tricount)
    {
        // Récupérer les participants (liste des userId)
        var participantIds = tricount.Participants
            .Select(p => p.Id)
            .Distinct()
            .ToList();

        // Récupérer les opérations du tricount
        var operations = tricount.Operations;

        // Récupérer les répartitions liées au tricount
        var repartitions = await context.Repartitions
            .Where(r => r.Operation.TricountId == tricount.Id)
            .Select(r => new { r.OperationId, r.UserId, r.Weight })
            .ToListAsync();

        // Total payé par utilisateur
        var paidPerUser =
            operations
                .GroupBy(o => o.InitiatorId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Paid = g.Sum(x => x.Amount)
                })
                .ToList();

        // Somme des poids par opération
        var totalWeights =
            repartitions
                .GroupBy(r => r.OperationId)
                .Select(g => new
                {
                    OperationId = g.Key,
                    TotalWeight = g.Sum(x => x.Weight)
                })
                .ToList();

        // Parts dues par utilisateur
        var sharesPerUser =
            (from r in repartitions
             join o in operations on r.OperationId equals o.Id
             join w in totalWeights on r.OperationId equals w.OperationId
             select new
             {
                 r.UserId,
                 Share = o.Amount * (decimal)r.Weight / (decimal)w.TotalWeight
             })
            .ToList();

        // Total dû par utilisateur
        var duePerUser =
            sharesPerUser
                .GroupBy(s => s.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Due = g.Sum(x => x.Share)
                })
                .ToList();

        // Construire la liste finale pour chaque participant
        var balances =
            (from userId in participantIds
             join p in paidPerUser on userId equals p.UserId into paidLeft
             from p in paidLeft.DefaultIfEmpty()
             join d in duePerUser on userId equals d.UserId into dueLeft
             from d in dueLeft.DefaultIfEmpty()
             orderby userId
             select new TricountBalanceDTO
             {
                 User = userId,
                 Paid = p?.Paid ?? 0m,
                 Due = d?.Due ?? 0m,
                 Balance = (p?.Paid ?? 0m) - (d?.Due ?? 0m)
             })
            .ToList();

        return balances;
    }

    /// <summary>Charge un tricount par son identifiant.</summary>
    public static async Task<TricountEntity?> GetById(TricountContext context, int tricountId)
    {
        return await context.Tricounts
            .Include(t => t.Participants)
            .Include(t => t.Operations)
                .ThenInclude(o => o.Repartitions.OrderBy(r => r.UserId))
            .SingleOrDefaultAsync(t => t.Id == tricountId);
    }

}
