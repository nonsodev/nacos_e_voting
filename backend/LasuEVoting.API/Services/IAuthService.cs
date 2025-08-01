using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public interface IAuthService
    {
        Task<(User user, string token)> GoogleSignInAsync(string email, string name, string googleId, string? imageUrl);
        Task<User?> GetUserByIdAsync(int userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<bool> UpdateDetailsNumberAsync(int userId, string matricNumber, string FullName);
        string GenerateJwtToken(User user);
    }
}