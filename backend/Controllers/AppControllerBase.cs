using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TricountApp.Models;
using TricountApp.Models.Entities;

namespace TricountApp.Controllers;

public abstract class AppControllerBase : ControllerBase
{
    protected readonly TricountContext context;

    protected AppControllerBase(TricountContext context)
    {
        this.context = context;
    }

    protected async Task<UserEntity?> GetLoggedUser()
    {
        var id = GetLoggedUserId();
        if (id == null)
            return null;

        return await context.Users.FindAsync(id.Value);
    }

    protected int? GetLoggedUserId()
    {
        var idStr = User?.Identity?.Name;
        if (string.IsNullOrWhiteSpace(idStr))
            return null;

        return int.TryParse(idStr, out var id) ? id : null;
    }

    protected bool? IsAdmin()
    {
        if (User?.Identity?.IsAuthenticated != true)
            return null;

        if (!User.Claims.Any(c => c.Type == ClaimTypes.Role))
            return null;

        return User.IsInRole(Role.Admin.ToString());
    }
}
