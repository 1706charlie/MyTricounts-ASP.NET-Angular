using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TricountApp.Models.Entities;

public enum Role
{
    BasicUser = 0,
    Admin = 1
}
public class UserEntity {

    [Key]
    public int Id { get; set; } // EF Core va auto-incrémenter Id automatiquement
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Iban { get; set; }
    public Role Role { get; set; } = Role.BasicUser;

    [NotMapped] // Non persisté (non socké en base)
    public string Password { get; set; } = null!;

    [NotMapped]
    public string? Token { get; set; } // rempli après login (JWT)

    /// <summary>Tricounts auxquels cet utilisateur participe.</summary>
    public ICollection<TricountEntity> Tricounts { get; set; } = new HashSet<TricountEntity>();

    /// <summary>Tricounts créés par cet utilisateur.</summary>
    public ICollection<TricountEntity> CreatedTricounts { get; set; } = new HashSet<TricountEntity>();

    /// <summary>Participations pour cet utilisateur.</summary>
    public ICollection<ParticipationEntity> Participations { get; set; } = new HashSet<ParticipationEntity>();

    /// <summary>Opérations où l'utilisateur est participant.</summary>
    public ICollection<OperationEntity> Operations { get; set; } = new HashSet<OperationEntity>();

    /// <summary>Opérations créées par cet utilisateur.</summary>
    public ICollection<OperationEntity> InitiatedOperations { get; set; } = new HashSet<OperationEntity>();

    /// <summary>Répartitions associant cet utilisateur aux opérations.</summary>
    public ICollection<RepartitionEntity> Repartitions { get; set; } = new HashSet<RepartitionEntity>();




    /// <summary>Charge en db les identifiants existants existants correspondant aux userIds fournis.</summary>
    public static async Task<List<int>> GetExistingUserIds(TricountContext context, IEnumerable<int> userIds)
    {
        return await context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();
    }

    /// <summary> Charge en db les User Users correspondant aux usersIds fournis en paramètre.</summary>
    public static async Task<List<UserEntity>> GetExistingUsers(TricountContext context, IEnumerable<int> userIds)
    {
        return await context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();
    }

    /// <summary>Charge un utilisateur par son identifiant.</summary>
    public static async Task<UserEntity?> GetById(TricountContext context, int userId)
    {
        return await context.Users.FindAsync(userId);
    }
}
