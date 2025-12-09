namespace TricountApp.Models.DTO;

/// Représente la balance d'un utilisateur dans un tricount :
 /// - Paid   : total payé par cet utilisateur
 /// - Due    : total qu'il aurait dû payer (sa part des dépenses)
 /// - Balance: Paid - Due (positif => doit recevoir, négatif => doit payer)
public class TricountBalanceDTO {
    public int User { get; set; } // Id de l'utilisateur
    public decimal Paid { get; set; } // Total payé par cet utilisateur dans ce tricount
    public decimal Due { get; set; } // Total du par cet utilisateur (somme de ses parts)
    public decimal Balance { get; set; }  // Paid - due : si positif, il doit recevoir sinon il doit payer
}