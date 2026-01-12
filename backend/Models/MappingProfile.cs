using AutoMapper;
using TricountApp.Models.DTO;
using TricountApp.Models.Entities;

namespace TricountApp.Models;

// remarque :  d comme destination
//             s comme source 
//             o comme option

public class MappingProfile : Profile
{
    private readonly TricountContext _context;

    public MappingProfile(TricountContext context) {

        _context = context;

    // get_all_users + get_user_data
        CreateMap<UserEntity, UserDTO>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.Name))
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role == Role.Admin ? "admin" : "basic_user"));

    // signup
        CreateMap<SignupDTO, UserEntity>()
            .ForMember(d => d.Name, o => o.MapFrom(s => s.FullName))
            .ForMember(d => d.PasswordHash, o => o.Ignore()) // haché après
            // User.Password est [NotMapped], donc non persisté, donc ignoré par défaut. cette commande sert à forcer explicitement AutoMapper à copier le mot de passe reçu (DTO) vers le champ transitoire User.Password.
            // Pour permettre au contrôleur de hasher ce mot de passe ensuite initialisé Password à vide
            .ForMember(d => d.Password, o => o.MapFrom(src => src.Password));

    // get_my_tricounts + save_tricount + save_operation
        CreateMap<TricountEntity, TricountDTO>()
            .ForMember(d => d.Participants, o => o.MapFrom(s => s.Participants.OrderBy(o => o.Name))) 
            .ForMember(d => d.Operations, o => o.MapFrom(s => s.Operations.OrderByDescending(o => o.CreatedAt)));

        CreateMap<OperationEntity, OperationDTO>()
            .ForMember(d => d.TricountId, o => o.Ignore());

        CreateMap<RepartitionEntity, RepartitionDTO>();

        CreateMap<ParticipationEntity, ParticipationDTO>();
    }
}
