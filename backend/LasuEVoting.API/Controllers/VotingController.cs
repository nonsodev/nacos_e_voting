using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LasuEVoting.API.Services;

namespace LasuEVoting.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VotingController : ControllerBase
    {
        private readonly IVotingService _votingService;
        private readonly IAuthService _authService;
        private readonly ILogger<VotingController> _logger;

        public VotingController(IVotingService votingService, IAuthService authService, ILogger<VotingController> logger)
        {
            _votingService = votingService;
            _authService = authService;
            _logger = logger;
        }

        [HttpGet("positions")]
        public async Task<IActionResult> GetPositions()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null || !user.IsActivated)
                    return Unauthorized(new { message = "Account not activated" });

                if (!await _votingService.IsVotingActiveAsync())
                    return BadRequest(new { message = "Voting is not currently active" });

                var positions = await _votingService.GetActivePositionsWithCandidatesAsync();

                var result = positions.Select(p => new
                {
                    id = p.Id,
                    title = p.Title,
                    description = p.Description,
                    maxVotes = p.MaxVotes,
                    candidates = p.Candidates.Select(c => new
                    {
                        id = c.Id,
                        fullName = c.FullName,
                        matricNumber = c.MatricNumber,
                        biography = c.Biography,
                        imageUrl = c.ImageUrl
                    }).ToList(),
                    hasVoted = _votingService.HasUserVotedForPositionAsync(userId, p.Id).Result
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting positions");
                return BadRequest(new { message = "Failed to get positions" });
            }
        }

        [HttpPost("cast-vote")]
        public async Task<IActionResult> CastVote([FromBody] CastVoteRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null || !user.IsActivated)
                    return Unauthorized(new { message = "Account not activated" });

                var success = await _votingService.CastVoteAsync(userId, request.PositionId, request.CandidateId);

                if (!success)
                    return BadRequest(new { message = "Failed to cast vote" });

                return Ok(new { message = "Vote cast successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error casting vote");
                return BadRequest(new { message = "Failed to cast vote" });
            }
        }

        [HttpGet("voting-status")]
        public async Task<IActionResult> GetVotingStatus()
        {
            try
            {
                var isActive = await _votingService.IsVotingActiveAsync();
                return Ok(new { isActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voting status");
                return BadRequest(new { message = "Failed to get voting status" });
            }
        }

        [HttpGet("my-votes")]
        public async Task<IActionResult> GetMyVotes()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null || !user.IsActivated)
                    return Unauthorized(new { message = "Account not activated" });

                // Get user's votes with position and candidate details
                var votes = user.Votes.Select(v => new
                {
                    positionTitle = v.Position.Title,
                    candidateName = v.Candidate.FullName,
                    votedAt = v.VotedAt
                }).ToList();

                return Ok(votes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user votes");
                return BadRequest(new { message = "Failed to get votes" });
            }
        }
    }

    public class CastVoteRequest
    {
        public int PositionId { get; set; }
        public int CandidateId { get; set; }
    }
}