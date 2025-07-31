using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LasuEVoting.API.Data;
using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<(User user, string token)> GoogleSignInAsync(string email, string name, string googleId, string? imageUrl)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                // Create new user
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
                // Update existing user
                user.FullName = name;
                user.ProfileImageUrl = imageUrl;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);
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

        public async Task<bool> UpdateMatricNumberAsync(int userId, string matricNumber)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Check if matric number already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.MatricNumber == matricNumber && u.Id != userId);
            if (existingUser != null) return false;

            user.MatricNumber = matricNumber;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"] ?? "your-super-secret-key-that-is-at-least-32-characters-long");

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("role", user.IsAdmin ? "admin" : "student"),
                new Claim("isActivated", user.IsActivated.ToString()),
                new Claim("matricNumber", user.MatricNumber ?? "")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(int.Parse(jwtSettings["ExpiryInDays"] ?? "7")),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}