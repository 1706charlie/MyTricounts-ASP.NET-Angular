using Microsoft.AspNetCore.Authorization;
using TricountApp.Models.Entities;

namespace TricountApp.Helpers;
/*
    Certaines requêtes ne doivent être autorisées que pour certains rôles. 
    Par défaut, l'attribut [Authorize] indique simplement qu'il faut être authentifié, mais accepte tous les rôles.
    Pour pouvoir faire des distinctions en fonction du rôle, nous avons besoin d'une nouvelle classe attribut qui hérite de AuthorizeAttribut

    En réalité, l'attribut [Authorize] permet déjà de faire cette distinction, mais il ne prend comme argument que des string. Pour rendre le choses plus fluides, le nouvel attribut [Authorized] va permettre de spécifier les rôles ayant accès en utilisant directement l'enum Role.
    Grâce à cet attribut, on peut maintenant marquer les méthodes du contrôleur qui sont sensibles au rôle de la manière suivante :

    Authorized(Role.Admin)]
    [HttpPut]
    public async Task<IActionResult> PutUser(UserDTO dto) {
    ...
    }

    il est possible d'autoriser plusieurs rôles pour une même requête. Par exemple :
    [Authorized(Role.Manager, Role.Admin)]
*/
public class AuthorizedAttribute : AuthorizeAttribute
{
    public AuthorizedAttribute(params Role[] roles) : base() {
        var rolesNames = new List<string>();
        var names = Enum.GetNames(typeof(Role));
        foreach (var role in roles) {
            rolesNames.Add(names[(int)role]);
        }
        Roles = String.Join(",", rolesNames);
    }
}
