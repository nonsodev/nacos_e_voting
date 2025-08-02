using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LasuEVoting.API.Services;

namespace LasuEVoting.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IAuthService _authService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, IAuthService authService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _authService = authService;
            _logger = logger;
        }

        private async Task<bool> IsAdminAsync()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _authService.GetUserByIdAsync(userId);
            return user?.IsAdmin == true;
        }

        [HttpPost("positions")]
        public async Task<IActionResult> CreatePosition([FromBody] CreatePositionRequest request)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var position = await _adminService.CreatePositionAsync(request.Title, request.Description, request.MaxVotes);
                return Ok(position);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating position");
                return BadRequest(new { message = "Failed to create position" });
            }
        }

        [HttpGet]
        public IActionResult Get()
        {
            return Ok("Admin endpoint working");
        }

        [HttpPost("candidates")]
        public async Task<IActionResult> CreateCandidate([FromForm] CreateCandidateRequest request)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var candidate = await _adminService.CreateCandidateAsync(
                    request.FullName, 
                    request.MatricNumber, 
                    request.NickName, 
                    request.PositionId, 
                    request.Image);

                return Ok(candidate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating candidate");
                return BadRequest(new { message = "Failed to create candidate" });
            }
        }

        [HttpPost("voting-sessions")]
        public async Task<IActionResult> CreateVotingSession([FromBody] CreateVotingSessionRequest request)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var session = await _adminService.CreateVotingSessionAsync(
                    request.Title, 
                    request.Description, 
                    request.StartTime, 
                    request.EndTime, 
                    userId);

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating voting session");
                return BadRequest(new { message = "Failed to create voting session" });
            }
        }

        [HttpPost("voting-sessions/{id}/start")]
        public async Task<IActionResult> StartVoting(int id)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var success = await _adminService.StartVotingAsync(id);
                if (!success)
                    return BadRequest(new { message = "Failed to start voting" });

                return Ok(new { message = "Voting started successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting voting");
                return BadRequest(new { message = "Failed to start voting" });
            }
        }

        [HttpPost("voting-sessions/{id}/end")]
        public async Task<IActionResult> EndVoting(int id)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var success = await _adminService.EndVotingAsync(id);
                if (!success)
                    return BadRequest(new { message = "Failed to end voting" });

                return Ok(new { message = "Voting ended successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ending voting");
                return BadRequest(new { message = "Failed to end voting" });
            }
        }

        [HttpGet("positions")]
        public async Task<IActionResult> GetAllPositions()
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var positions = await _adminService.GetAllPositionsAsync();
                return Ok(positions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting positions");
                return BadRequest(new { message = "Failed to get positions" });
            }
        }

        [HttpGet("candidates")]
        public async Task<IActionResult> GetAllCandidates()
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var candidates = await _adminService.GetAllCandidatesAsync();
                return Ok(candidates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting candidates");
                return BadRequest(new { message = "Failed to get candidates" });
            }
        }

        [HttpGet("voting-sessions")]
        public async Task<IActionResult> GetAllVotingSessions()
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var sessions = await _adminService.GetAllVotingSessionsAsync();
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voting sessions");
                return BadRequest(new { message = "Failed to get voting sessions" });
            }
        }

        [HttpGet("results")]
        public async Task<IActionResult> GetVoteResults()
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var results = await _adminService.GetDetailedVoteResultsAsync();
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vote results");
                return BadRequest(new { message = "Failed to get vote results" });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var users = await _adminService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return BadRequest(new { message = "Failed to get users" });
            }
        }

        [HttpDelete("positions/{id}")]
        public async Task<IActionResult> DeletePosition(int id)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var success = await _adminService.DeletePositionAsync(id);
                if (!success)
                    return BadRequest(new { message = "Failed to delete position" });

                return Ok(new { message = "Position deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting position");
                return BadRequest(new { message = "Failed to delete position" });
            }
        }

        [HttpDelete("candidates/{id}")]
        public async Task<IActionResult> DeleteCandidate(int id)
        {
            try
            {
                if (!await IsAdminAsync())
                    return Forbid();

                var success = await _adminService.DeleteCandidateAsync(id);
                if (!success)
                    return BadRequest(new { message = "Failed to delete candidate" });

                return Ok(new { message = "Candidate deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting candidate");
                return BadRequest(new { message = "Failed to delete candidate" });
            }
        }
    }

    public class CreatePositionRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int MaxVotes { get; set; } = 1;
    }

    public class CreateCandidateRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? MatricNumber { get; set; }
        public string? NickName { get; set; }
        public int PositionId { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class CreateVotingSessionRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}