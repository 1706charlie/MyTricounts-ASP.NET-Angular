using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class DeleteTricountDTO
{
    [JsonPropertyName("tricount_id")]
    public int TricountId { get; set; }
}
