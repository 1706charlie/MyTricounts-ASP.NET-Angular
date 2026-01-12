using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class SaveOperationDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public decimal Amount { get; set; }
    [JsonPropertyName("operation_date")]
    public DateOnly OperationDate {get; set;}
    [JsonPropertyName("tricount_id")]
    public int TricountId {get; set;}
    [JsonPropertyName("initiator")]
    public int InitiatorId {get; set;}
    public ICollection<RepartitionDTO> Repartitions {get; set;} = new HashSet<RepartitionDTO>(); 
}

/*
Comportement ASP.NET Core lorsque certaines valeurs ne sont pas envoyées dans le JSON :
 - Le client n’envoie pas "id" : ASP.NET Core met Id = 0.
 - Le client n’envoie pas "title" : ASP.NET Core met Title = null.
 - Le client n’envoie pas "amount" : ASP.NET Core met Amount = 0.
 - Le client n’envoie pas "operation_date" : ASP.NET Core met OperationDate = default(DateOnly) = 01/01/0001.
 - Le client n’envoie pas "tricount_id" : ASP.NET Core met TricountId = 0.
 - Le client n’envoie pas "initiator" : ASP.NET Core met InitiatorId = 0.
 - Le client n’envoie pas "repartitions" : ASP.NET Core initialise Repartitions = collection vide (pas null).
*/