using Microsoft.AspNetCore.Mvc;

public class GetTricountBalanceDTO {
    
    [FromQuery(Name = "tricount_id")]
    public int TricountId { get; set; }
}

/*
Ce qui se passe pour chaque propriété quand le client n’envoie pas la valeur dans le JSON : 
 - Le client n’envoie pas id du tout : ASP.NET Core met Id = 0.
*/
