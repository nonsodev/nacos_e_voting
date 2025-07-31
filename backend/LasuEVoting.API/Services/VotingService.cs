using Microsoft.EntityFrameworkCore;
using LasuEVoting.API.Data;
using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public class VotingService : IVotingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VotingService> _logger;

        public VotingService(ApplicationDbContext context, ILogger<VotingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Position>> GetActivePositionsWithCandidatesAsync()
        {
            return await _context.Positions
                .Where(p => p.IsActive)
                .Include(p => p.Candidates.Where(c => c.IsActive))
                .OrderBy(p => p.Title)
                .ToListAsync();
        }

        public async Task<bool> CastVoteAsync(int userId, int positionId, int candidateId)
        {
            try
            {
                // Check if voting is active
                if (!await IsVotingActiveAsync())
                {
                    _logger.LogWarning($"Voting attempt when voting is not active. User: {userId}");
                    return false;
                }

                // Check if user has already voted for this position
                if (await HasUserVotedForPositionAsync(userId, positionId))
                {
                    _logger.LogWarning($"User {userId} attempted to vote twice for position {positionId}");
                    return false;
                }

                // Verify that the candidate belongs to the position
                var candidate = await _context.Candidates
                    .FirstOrDefaultAsync(c => c.Id == candidateId && c.PositionId == positionId && c.IsActive);

                if (candidate == null)
                {
                    _logger.LogWarning($"Invalid candidate {candidateId} for position {positionId}");
                    return false;
                }

                // Create vote
                var vote = new Vote
                {
                    UserId = userId,
                    PositionId = positionId,
                    CandidateId = candidateId,
                    VotedAt = DateTime.UtcNow
                };

                _context.Votes.Add(vote);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Vote cast successfully. User: {userId}, Position: {positionId}, Candidate: {candidateId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error casting vote. User: {userId}, Position: {positionId}, Candidate: {candidateId}");
                return false;
            }
        }

        public async Task<bool> HasUserVotedForPositionAsync(int userId, int positionId)
        {
            return await _context.Votes
                .AnyAsync(v => v.UserId == userId && v.PositionId == positionId);
        }

        public async Task<Dictionary<int, int>> GetVoteCountsAsync()
        {
            return await _context.Votes
                .GroupBy(v => v.CandidateId)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
        }

        public async Task<bool> IsVotingActiveAsync()
        {
            var activeSession = await _context.VotingSessions
                .FirstOrDefaultAsync(vs => vs.IsActive && 
                                          vs.StartTime <= DateTime.UtcNow && 
                                          vs.EndTime >= DateTime.UtcNow);

            return activeSession != null;
        }
    }
}