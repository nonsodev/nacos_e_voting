using LasuEVoting.API.Controllers;
using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public interface IAdminService
    {
        Task<Position> CreatePositionAsync(string title, string? description, int maxVotes = 1);
        Task<Candidate> CreateCandidateAsync(string fullName, string? matricNumber, string? NickName, int positionId, IFormFile file);
        Task<VotingSession> CreateVotingSessionAsync(string title, string? description, DateTime startTime, DateTime endTime, int createdByUserId);
        Task<bool> StartVotingAsync(int sessionId);
        Task<bool> EndVotingAsync(int sessionId);
        Task<IEnumerable<object>> GetAllPositionsAsync();
        Task<IEnumerable<object>> GetAllCandidatesAsync();
        Task<IEnumerable<object>> GetAllVotingSessionsAsync();
        Task<Dictionary<int, Dictionary<int, int>>> GetDetailedVoteResultsAsync();
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<bool> DeletePositionAsync(int positionId);
        Task<bool> DeleteCandidateAsync(int candidateId);
    }
}