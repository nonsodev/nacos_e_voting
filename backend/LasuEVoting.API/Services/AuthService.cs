using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LasuEVoting.API.Data;
using LasuEVoting.API.Models;
using System.Text.RegularExpressions;
using CloudinaryDotNet.Actions;

namespace LasuEVoting.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContext;

        public AuthService(ApplicationDbContext context, IConfiguration configuration,IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _configuration = configuration;
            _httpContext = httpContextAccessor;
        }

        public async Task<(User user, string token)> GoogleSignInAsync(string email, string name, string googleId, string? imageUrl)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    FullName = name,
                    GoogleId = googleId,
                    ProfileImageUrl = imageUrl,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else
            {
                user.ProfileImageUrl = imageUrl;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var token = GenerateJwtToken(_configuration["Jwt:Key"], _configuration["Jwt:Issuer"], user);
            return (user, token);
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> UpdateDetailsNumberAsync(int userId, string matricNumber, string fullName)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (!IsValidMatricNumber(matricNumber))
                return false;

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.MatricNumber == matricNumber && u.Id != userId);
            if (existingUser != null)
                return false;

            user.MatricNumber = matricNumber;
            user.FullName = fullName;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        private readonly HashSet<string> _allowedExceptions = new HashSet<string>
        {
            "210551003" 
        };

        private bool IsValidMatricNumber(string matricNumber)
        {
            if (_allowedExceptions.Contains(matricNumber))
                return true;

            return Regex.IsMatch(matricNumber, @"^\d{2}0591\d{3}$");
        }

        public async Task<BaseResponse<UserDto>> GetCurrentUserAsync()
        {
            var user = _httpContext.HttpContext?.User;

            if (user == null || !(user.Identity?.IsAuthenticated ?? false))
                return new BaseResponse<UserDto>
                {
                    IsSuccessful = false,
                    Message = "Unauthenticated"
                };

            var idClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            var emailClaim = user.FindFirst(ClaimTypes.Email);
            var fullNameClaim = user.FindFirst(ClaimTypes.Name);
            if (idClaim == null || !int.TryParse(idClaim.Value, out int id))
                return new BaseResponse<UserDto>
                {
                    IsSuccessful = false,
                    Message = "Invalid user ID"
                };

            var userEntity = await _context.Users.FindAsync(id);
            if (userEntity == null)
                return new BaseResponse<UserDto>
                {
                    IsSuccessful = false,
                    Message = "User not found"
                };

            var role = userEntity.IsAdmin ? "admin" : "student";

            var dto = new UserDto
            {
                Id = userEntity.Id,
                Email = emailClaim?.Value ?? string.Empty,
                FullName = fullNameClaim?.Value ?? string.Empty,
                MatricNumber = userEntity.MatricNumber,
                IsActivated = userEntity.IsActivated,
                ProfileImageUrl = userEntity.ProfileImageUrl,
                Role = role
            };

            return new BaseResponse<UserDto>
            {
                IsSuccessful = true,
                Value = dto,
                Message = "User fetched successfully"
            };
        }



        public bool IsTokenValid(string key, string issuer, string token)
        {
            var mySecret = Encoding.UTF8.GetBytes(key);
            var mySecurityKey = new SymmetricSecurityKey(mySecret);

            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidIssuer = issuer,
                    ValidAudience = issuer,
                    IssuerSigningKey = mySecurityKey
                }, out SecurityToken validatedToken);
            }
            catch
            {
                return false;
            }
            return true;
        }

        public static int GetLoginId(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            if (idClaim != null)
            {
                string userId = idClaim.Value;
                return int.Parse(userId);
            }
            else
            {
                return 0;
            }
        }

        public string GenerateJwtToken(string key, string issuer, User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("role", user.IsAdmin ? "admin" : "student"),
                new Claim("isActivated", user.IsActivated.ToString()),
                new Claim("matricNumber", user.MatricNumber ?? "")
            };


            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var tokenDescriptor = new JwtSecurityToken(issuer, issuer, claims, expires: DateTime.Now.AddHours(1), signingCredentials: credentials);
            var token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
            return token;
        }
    }
    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string MatricNumber { get; set; }
        public bool IsActivated { get; set; }
        public string Role { get; set; }
        public string ProfileImageUrl { get; set; }
        
    }

}