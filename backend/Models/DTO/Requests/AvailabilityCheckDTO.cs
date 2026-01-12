using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class EmailAvailabilityDTO
{
    public string Email { get; set; } = "";

    [JsonPropertyName("user_id")]
    public int UserId { get; set; }
}

public class FullNameAvailabilityDTO
{
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = "";

    [JsonPropertyName("user_id")]
    public int UserId { get; set; }
}

public class TricountTitleAvailabilityDTO
{
    public string Title { get; set; } = "";

    [JsonPropertyName("tricount_id")]
    public int TricountId { get; set; }
}