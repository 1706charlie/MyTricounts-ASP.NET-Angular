namespace TricountApp.Models.Entities;

// Une répartition associe un utilisateur à une dépense (Operation)
// via un poids (> 0) représentant sa part de la dépense.
public class RepartitionEntity
{
    public int OperationId { get; set; } // Id de la dépense (clé étrangère)
    public int UserId { get; set; } // Id de l'utilisateur impliqué dans cette dépense (clé étrangère)
    public int Weight { get; set; }
    public OperationEntity Operation { get; set; } = null!; // La dépense à laquelle appartient cette répartition
    public UserEntity User { get; set; } = null!; // L'utilisateur à qui correspond cette répartition

}
