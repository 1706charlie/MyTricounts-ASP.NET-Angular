using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TricountApp.Models;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

namespace TricountApp.Controllers;

[Authorize]
[Route("rpc")]
[ApiController]
public class TricountController : AppControllerBase
{
    private readonly IMapper _mapper;

    public TricountController(TricountContext context, IMapper mapper) : base(context)
    {
        _mapper = mapper;
    }

    // -----------------------------------------
    // GET /rpc/ping
    // -----------------------------------------
    [AllowAnonymous]
    [HttpGet("ping")]
    public ActionResult<string> Ping() => "\"Hello from project prid-2526-f03!\"";

    // -----------------------------------------
    // POST /rpc/reset_database
    // -----------------------------------------
    [AllowAnonymous]
    [HttpPost("reset_database")]
    public async Task<ActionResult> ResetDatabase()
    {
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        return NoContent();
    }

    // -----------------------------------------
    // GET /rpc/get_my_tricounts
    // -----------------------------------------
    [HttpGet("get_my_tricounts")]
    public async Task<ActionResult<ICollection<TricountDTO>>> GetMyTricounts() 
    {
        var userId = GetLoggedUserId();
        var isAdmin = IsAdmin();
        
        var tricounts = await TricountEntity.GetMyTricounts(context, userId!.Value, isAdmin!.Value);

        var dto = _mapper.Map<List<TricountDTO>>(tricounts);
        return Ok(dto);
    }

    // -----------------------------------------
    // GET /rpc/get_tricount_balance   rpc/get_tricount_balance?tricount_id=4
    // -----------------------------------------
    [HttpGet("get_tricount_balance")]
    public async Task<ActionResult<ICollection<TricountBalanceDTO>>> GetTricountBalance([FromQuery] GetTricountBalanceDTO dto)
    {
        var loggedUser = await GetLoggedUser();

        var validator = new GetTricountBalanceDTOValidator(context, loggedUser!);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var tricount = await TricountEntity.GetById(context, dto.TricountId);
        if (tricount == null) return NotFound();

        var balances = await TricountEntity.ComputeBalances(context, tricount); // on envoit le context car méthode statique

        return Ok(balances);
    }

    // -----------------------------------------
    // POST /rpc/check_tricount_title_available
    // -----------------------------------------
    [HttpPost("check_tricount_title_available")]
    public async Task<ActionResult<bool>> CheckTricountTitleAvailable(TricountTitleAvailabilityDTO dto)
    {
        var loggedUser = await GetLoggedUser();
        var title = dto.Title.Trim().ToLower();

        var tricountId = dto.TricountId;
        int creatorId;

        if (tricountId == 0)
        {
            // Création -> le créateur est l’utilisateur connecté
            creatorId = loggedUser!.Id;
        }
        else
        {
            // Update -> on récupère le creatorId du tricount existant
            var tricountCreatorId = await context.Tricounts
                .Where(t => t.Id == tricountId)
                .Select(t => t.CreatorId)
                .SingleOrDefaultAsync();

            creatorId = tricountCreatorId;
        }

        // Recherche d'un tricount portant déjà ce titre MAIS pour le créateur du tricount
        var titleAlreadyUsed = await context.Tricounts.AnyAsync(t =>
            t.CreatorId == creatorId &&
            t.Id != tricountId &&
            t.Title.Trim().ToLower() == title);

        return Ok(!titleAlreadyUsed);
    }

    // -----------------------------------------
    // POST /rpc/save_tricount
    // -----------------------------------------
    [HttpPost("save_tricount")]
    public async Task<ActionResult<TricountDTO>> SaveTricount(SaveTricountDTO dto)
    {
        var loggedUser = await GetLoggedUser();

        var validator = new SaveTricountDTOValidator(context, loggedUser!);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var title = dto.Title.Trim();
        var description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        var desiredIds = dto.Participants;

        TricountEntity? tricount;

        // Création
        if (dto.Id == 0) { 
            desiredIds.Add(loggedUser!.Id); // on ajoute le créateur comme participant, si il était déja présent, pas de soucis : on travaille avec HashSet : ne conserve pas les doublons
            
            tricount = new TricountEntity
            {
                Title = title,
                Description = description,
                CreatorId = loggedUser!.Id,
                CreatedAt = DateTime.UtcNow
            };

            var users = await UserEntity.GetExistingUsers(context, desiredIds);
            
            // foreach (var u in users)
            //     tricount.Participants.Add(u);
            tricount.Participants = tricount.Participants.Concat(users).ToList();


            context.Tricounts.Add(tricount);
        }

        // Mise à jour
        else { 
            tricount = await TricountEntity.GetById(context, dto.Id);
            if (tricount == null) return NotFound();

            tricount.Title = title;
            tricount.Description = description;            
            
            tricount.Participants.Clear();
            var users = await UserEntity.GetExistingUsers(context, desiredIds);

            // foreach (var user in users)
            //     tricount.Participants.Add(user);
            tricount.Participants = tricount.Participants.Concat(users).ToList();
        }    

        await context.SaveChangesAsync();

        // réponse
        var dtoOut = _mapper.Map<TricountDTO>(tricount);
        return Ok(dtoOut);
    }

    // -----------------------------------------
    // POST /rpc/save_operation
    // -----------------------------------------
    [HttpPost("save_operation")]
    public async Task<ActionResult<OperationDTO>> SaveOperation(SaveOperationDTO dto)
    {
        var loggedUser = await GetLoggedUser();

        var validator = new SaveOperationDTOValidator(context, loggedUser!);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var title = dto.Title.Trim();
        var repartitions = dto.Repartitions.Select(rep => new RepartitionEntity
        {
            UserId = rep.UserId,
            Weight = rep.Weight
        }).ToHashSet();

        OperationEntity? operation;

        // Création
        if (dto.Id == 0) { 
            operation = new OperationEntity 
            {
                Title = title,
                Amount = dto.Amount,
                OperationDate = dto.OperationDate,
                TricountId = dto.TricountId,
                InitiatorId = dto.InitiatorId,
                CreatedAt = DateTime.UtcNow
            };

            // foreach (var repartition in repartitions)
            //     operation.Repartitions.Add(repartition);
            operation.Repartitions = operation.Repartitions.Concat(repartitions).ToList();

            context.Operations.Add(operation);
        }

        // Mise à jour
        else {  
            operation = await OperationEntity.GetById(context, dto.Id);
            if (operation == null) return NotFound();

            operation.Title = title;
            operation.Amount = dto.Amount;
            operation.OperationDate = dto.OperationDate;
            operation.InitiatorId = dto.InitiatorId;

            operation.Repartitions.Clear();
            
            // foreach (var repartition in repartitions)
            //     operation.Repartitions.Add(repartition);
            operation.Repartitions = operation.Repartitions.Concat(repartitions).ToList();
        }   

        await context.SaveChangesAsync();

        // réponse
        var dtoOut = _mapper.Map<OperationDTO>(operation);
        return Ok(dtoOut);
    }
    
    // -----------------------------------------
    // POST /rpc/delete_operation
    // -----------------------------------------
    [HttpPost("delete_operation")]
    public async Task<IActionResult> DeleteOperation(DeleteOperationDTO dto)
    {
        var loggedUser = await GetLoggedUser();

        var validator = new DeleteOperationDTOValidator(context, loggedUser!);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var operation = await OperationEntity.GetById(context, dto.Id);
        if (operation == null) return NotFound();

        context.Operations.Remove(operation);
        await context.SaveChangesAsync();

        return NoContent();
    }

    // -----------------------------------------
    // POST /rpc/delete_tricount
    // -----------------------------------------
    [HttpPost("delete_tricount")]
    public async Task<IActionResult> DeleteTricount(DeleteTricountDTO dto)
    {
        var loggedUser = await GetLoggedUser();

        var validator = new DeleteTricountDTOValidator(context, loggedUser!);
        var result = await validator.ValidateAsync(dto);
        if (!result.IsValid)
            return BadRequest(new { Errors = result.Errors.Select(e => e.ErrorMessage) });

        var tricount = await TricountEntity.GetById(context, dto.TricountId);
        if (tricount == null) return NotFound();

        context.Tricounts.Remove(tricount);
        await context.SaveChangesAsync();
        
        return NoContent();
    }
}
