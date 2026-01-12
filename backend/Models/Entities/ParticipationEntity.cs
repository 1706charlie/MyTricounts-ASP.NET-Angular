namespace TricountApp.Models.Entities;

/// Représente la participation d'un utilisateur à un tricount.
/// C'est la table de jonction User <-> Tricount.
public class ParticipationEntity
{
    public int TricountId { get; set; } // FK vers le Tricount
    public TricountEntity Tricount { get; set; } = null!; // Navigation vers le tricount
    public int UserId { get; set; } // FK vers le User
    public UserEntity User { get; set; } = null!; // Navigation vers l'utilisateur
}
