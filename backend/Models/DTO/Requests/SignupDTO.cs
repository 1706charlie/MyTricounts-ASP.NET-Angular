using System.Text.Json.Serialization;

namespace TricountApp.Models.DTO;

public class SignupDTO
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = "";
    public string? Iban { get; set; }
}

/*
Comportement ASP.NET Core lorsque certaines valeurs ne sont pas envoyées dans le JSON :
 - Le client n’envoie pas "email" : ASP.NET Core met Email = "" (string non-null, valeur par défaut du DTO).
 - Le client n’envoie pas "password" : ASP.NET Core met Password = "".
 - Le client n’envoie pas "full_name" :  ASP.NET Core met FullName = "".
 - Le client n’envoie pas "iban" : ASP.NET Core met Iban = null.
*/