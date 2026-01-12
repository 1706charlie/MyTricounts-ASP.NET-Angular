namespace TricountApp.Models.DTO;

public class TricountBalanceDTO {
    public int User { get; set; } // Id de l'utilisateur
    public decimal Paid { get; set; } 
    public decimal Due { get; set; } 
    public decimal Balance { get; set; }
}