using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class UserDTO
{
    public int Id { get; set; }
    public string Email { get; set; } = null!; 
    
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = null!;
    public string? Iban { get; set; }
    public string Role { get; set; } = null!;
}

// DTO utilisé en entrée quand on doit envoyer un password
public class UserWithPasswordDTO : UserDTO
{
    public string Password { get; set; } = "";
}