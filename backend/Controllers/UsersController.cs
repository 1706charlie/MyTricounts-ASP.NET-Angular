using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TricountApp.Helpers;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

namespace TricountApp.Controllers;

[Authorize]
[Route("rpc")]
[ApiController]
public class UsersController : AppControllerBase
{
    private readonly IMapper _mapper;

    public UsersController(TricountContext context, IMapper mapper) : base(context)
    {
        _mapper = mapper;
    }

    // -----------------------------------------
    // POST /rpc/login
    // -----------------------------------------
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<object>> Login(LoginDTO dto) {
        var validator = new LoginDTOValidator(context);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var user = await Login(dto.Email, dto.Password);

        return Ok(new { token = user!.Token });
    }

    // -----------------------------------------
    // logique privée : login
    // -----------------------------------------
    private async Task<UserEntity?> Login(string email, string password) {
        var mail = (email ?? "").Trim().ToLower();
        var user = await context.Users.SingleOrDefaultAsync(u => u.Email.ToLower() == mail);
        if (user == null) return null;

        var hashedInput = TokenHelper.GetPasswordHash(password ?? "");
        if (hashedInput == user.PasswordHash) {
            var token = TokenHelper.GenerateJwtToken(user.Id.ToString(), user.Role);
            user.Token = token;
        }

        return user;
    }

    // -----------------------------------------
    // GET /rpc/get_all_users
    // -----------------------------------------
    [HttpGet("get_all_users")]
    public async Task<ActionResult<IEnumerable<UserDTO>>> GetAllUsers() {
        var users = await context.Users
            .AsNoTracking()
            .OrderBy(u => u.Name.ToLower()).ToListAsync();
        return _mapper.Map<List<UserDTO>>(users);
    }

    // -----------------------------------------
    // GET /rpc/get_user_data
    // -----------------------------------------
    [HttpGet("get_user_data")]
    public async Task<ActionResult<UserDTO>> GetUserData() {
        var loggedUser = await GetLoggedUser();
        return _mapper.Map<UserDTO>(loggedUser);
    }

    // -----------------------------------------
    // POST /rpc/signup
    // -----------------------------------------
    [AllowAnonymous]
    [HttpPost("signup")]
    public async Task<IActionResult> Signup(SignupDTO dto)
    {
        var validator = new SignupDTOValidator(context);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        return await PostUser(dto);
    }

    // -----------------------------------------
    // logique privée : signup
    // -----------------------------------------
    [HttpPost]
    public async Task<IActionResult> PostUser(SignupDTO dto) {
        var newUser = _mapper.Map<UserEntity>(dto); 
        
        newUser.PasswordHash = TokenHelper.GetPasswordHash(newUser.Password);
        newUser.Password = ""; // ne pas laisser traîner

        newUser.Email = newUser.Email.Trim().ToLower();
        newUser.Name = newUser.Name.Trim();
        newUser.Iban = string.IsNullOrWhiteSpace(newUser.Iban)
            ? null
            : newUser.Iban!.Trim().ToUpperInvariant();

        context.Users.Add(newUser);
        await context.SaveChangesAsync();

        return NoContent();
    }

    // -----------------------------------------
    // POST /rpc/check_email_available
    // -----------------------------------------
    [AllowAnonymous]
    [HttpPost("check_email_available")]
    public async Task<ActionResult<bool>> CheckEmailAvailable(EmailAvailabilityDTO dto)
    {
        var email = dto.Email.Trim().ToLower();

        // Recherche de l’utilisateur ayant cet email
        var user = await context.Users.SingleOrDefaultAsync(u =>
            u.Email != null && u.Email.Trim().ToLower() == email);

        // CAS 1 : email non utilisé -> disponible
        if (user == null)
            return Ok(true);

        // CAS 2 : email utilisé -> vérifier si c’est celui de l’utilisateur courant
        var userId = dto.UserId;
        if (userId != 0 && user.Id == userId)
            return Ok(true); // l'utilisateur garde son propre email -> autorisé

        // CAS 3 : email pris par un autre utilisateur
        return Ok(false);
    }

    // -----------------------------------------
    // POST /rpc/check_full_name_available
    // -----------------------------------------
    [AllowAnonymous]
    [HttpPost("check_full_name_available")]
    public async Task<ActionResult<bool>> CheckFullNameAvailable(FullNameAvailabilityDTO dto)
    {
        var name = dto.FullName.Trim().ToLower();

        // Recherche d'un user portant déjà ce nom d'affichage 
        var user = await context.Users.SingleOrDefaultAsync(u =>
            u.Name != null && u.Name.Trim().ToLower() == name);

        // CAS 1 : nom non utilisé -> disponible
        if (user == null)
            return Ok(true);

        // CAS 2 : nom utilisé -> vérifier si c’est celui de l’utilisateur courant
        var userId = dto.UserId;
        if (userId != 0 && user.Id == userId)
            return Ok(true); // l'utilisateur garde son propre nom -> autorisé

        // CAS 3 : nom pris par un autre utilisateur
        return Ok(false);
    }

}
