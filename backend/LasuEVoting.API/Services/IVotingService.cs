using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public interface IVotingService
    {
        Task<IEnumerable<Position>> GetActivePositionsWithCandidatesAsync();
        Task<bool> CastVoteAsync(int userId, int positionId, int candidateId);
        Task<bool> HasUserVotedForPositionAsync(int userId, int positionId);
        Task<Dictionary<int, int>> GetVoteCountsAsync();
        Task<bool> IsVotingActiveAsync();
    }
}