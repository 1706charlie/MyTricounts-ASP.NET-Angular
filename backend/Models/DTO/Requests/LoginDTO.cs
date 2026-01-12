// Models/DTO/AuthDTOs.cs
namespace TricountApp.Models.DTO;

public class LoginDTO {
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

/*
Comportement ASP.NET Core lorsque certaines valeurs ne sont pas envoyées dans le JSON :
 - Le client n’envoie pas "email" : ASP.NET Core met Email = "" (string non-null, valeur par défaut du DTO).
 - Le client n’envoie pas "password" : ASP.NET Core met Password = "".
*/
