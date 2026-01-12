namespace TricountApp.Models.DTO;

public class SaveTricountDTO
{
    public int Id { get; set; }                  // 0 => création, >0 => mise à jour
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public ICollection<int> Participants { get; set; } = new HashSet<int>(); // ids des users (sans le creator, il sera forcé)
}

/*
Ce qui se passe pour chaque propriété quand le client n’envoie pas la valeur dans le JSON : 
 - Le client n’envoie pas id du tout : ASP.NET Core met Id = 0.
 - Le client n’envoie pas title du tout : ASP.NET Core met Title = null.
 - Le client n'envoie pas description du tout : ASP.NET Core met Description = null.
 - Le client n'envoie pas collection de int : ASP.NET Core met Participants = collection vide (pas null)
*/