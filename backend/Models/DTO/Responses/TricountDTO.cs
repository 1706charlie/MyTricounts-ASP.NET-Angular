using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class TricountDTO {
    public int Id { get; set;}
    public string Title { get; set;} = null!;
    public string? Description { get; set;}

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("creator")]
    public int CreatorId { get; set; }
    
    public ICollection<UserDTO> Participants { get; set; } = new HashSet<UserDTO>();
    public ICollection<OperationDTO> Operations { get; set; } = new HashSet<OperationDTO>();
}

