using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;


public class OperationDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public decimal Amount { get; set; }

    [JsonPropertyName("operation_date")]
    public DateOnly OperationDate { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("initiator")]
    public int InitiatorId { get; set; }

    public int TricountId { get; set; }
    
    public ICollection<RepartitionDTO> Repartitions { get; set; } = new HashSet<RepartitionDTO>();
}


public class RepartitionDTO
{
    [JsonPropertyName("user")] // "user" = Id de l'utilisateur
    public int UserId { get; set; }

    [JsonPropertyName("weight")]
    public int Weight { get; set; }
}
