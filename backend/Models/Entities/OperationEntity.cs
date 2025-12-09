using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace TricountApp.Models.Entities;

/// Représente une operation (dépense) dans un tricount.
public class OperationEntity {

    [Key] 
    public int Id { get; set; } // EF Core va auto-incrémenter Id automatiquement
    public string Title { get; set; } = null!;
    public decimal Amount { get; set; } // Montant en euros
    public DateOnly OperationDate { get; set; } // Date où la dépense a été faite
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Date/heure de création en base  
    public int InitiatorId { get; set; } // FK vers l'initiateur (User)
    public UserEntity Initiator { get; set; } = null!;
    public int TricountId { get; set; } // Fk vers le Tricount
    public TricountEntity Tricount { get; set; } = null!;

    /// <summary>Participants impliqués dans la dépense.</summary>
    public ICollection<UserEntity> Participants { get; set; } = new HashSet<UserEntity>();

    /// <summary>Détaille comment la dépense est répartie entre les participants.</summary>
    public ICollection<RepartitionEntity> Repartitions { get; set; } = new HashSet<RepartitionEntity>();



    /// <summary>Charge une Operation avec ses répartitions.</summary>
    public static Task<OperationEntity?> GetById(TricountContext context, int operationId) {
        return context.Operations
            .Include(o => o.Repartitions)
            .SingleOrDefaultAsync(o => o.Id == operationId);
    }
}
