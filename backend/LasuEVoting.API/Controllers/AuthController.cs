using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LasuEVoting.API.Services;

namespace LasuEVoting.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("google-signin")]
        public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequest request)
        {
            try
            {
                var (user, token) = await _authService.GoogleSignInAsync(
                    request.Email, 
                    request.Name, 
                    request.GoogleId, 
                    request.Image
                );

                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        fullName = user.FullName,
                        matricNumber = user.MatricNumber,
                        isActivated = user.IsActivated,
                        role = user.IsAdmin ? "admin" : "student",
                        profileImageUrl = user.ProfileImageUrl
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Google sign in");
                return BadRequest(new { message = "Sign in failed" });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new
                {
                    id = user.Id,
                    email = user.Email,
                    fullName = user.FullName,
                    matricNumber = user.MatricNumber,
                    isActivated = user.IsActivated,
                    role = user.IsAdmin ? "admin" : "student",
                    profileImageUrl = user.ProfileImageUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return BadRequest(new { message = "Failed to get user information" });
            }
        }
    }

    public class GoogleSignInRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string GoogleId { get; set; } = string.Empty;
        public string? Image { get; set; }
    }
}