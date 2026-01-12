using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.IdentityModel.Tokens;
using TricountApp.Models;      
using TricountApp.Models.Entities;  

namespace TricountApp.Helpers;

public class TokenHelper
{
    private readonly TricountContext _context;
    public TokenHelper(TricountContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Génère un JWT en plaçant l'identité dans ClaimTypes.Name et le rôle dans ClaimTypes.Role.
    /// Dans V09, le prof utilise pseudo; ici, on peut passer l'email (recommandé) ou un autre identifiant string.
    /// </summary>
    public static string GenerateJwtToken(string identity, Role role)
    {
        var claims = new Claim[]
        {
            new Claim(ClaimTypes.Name, identity),
            new Claim(ClaimTypes.Role, role.ToString())
        };
        return GenerateJwtToken(claims);
    }

    /*
    IDX10720: Unable to create KeyedHashAlgorithm for algorithm
    'http://www.w3.org/2001/04/xmldsig-more#hmac-sha256',
    the key size must be greater than: '256' bits, key has '152' bits. (Parameter 'keyBytes')
    */

    public static string GenerateJwtToken(IEnumerable<Claim> claims)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        var key = Encoding.ASCII.GetBytes("my-super-secret-key my-super-secret-key");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            IssuedAt = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddMinutes(15),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public static ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("my-super-secret-key my-super-secret-key")
            ),
            ValidateLifetime = false // on accepte les tokens expirés ici
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        SecurityToken securityToken;
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
        var jwtSecurityToken = securityToken as JwtSecurityToken;
        if (jwtSecurityToken == null ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");

        return principal;
    }

    /// <summary>
    /// Hachage du mot de passe (version FAQ du prof — sel fixe).
    /// NOTE: Pour la vraie sécu, on préférera un sel aléatoire par utilisateur (qu’on stockera).
    /// Mais la FAQ demande d’utiliser exactement ceci dans un premier temps.
    /// </summary>
    public static string GetPasswordHash(string password)
    {
        string salt = "Peodks;zsOK30S,s";
        // derive a 256-bit subkey (use HMACSHA1 with 10,000 iterations)
        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: Encoding.UTF8.GetBytes(salt),
            prf: KeyDerivationPrf.HMACSHA1,
            iterationCount: 10000,
            numBytesRequested: 256 / 8));
        return hashed;
    }
}
