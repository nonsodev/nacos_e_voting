using Microsoft.EntityFrameworkCore;
using LasuEVoting.API.Data;
using LasuEVoting.API.Models;
using Microsoft.Extensions.Logging;

namespace LasuEVoting.API.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDocumentService _documentService;
        private readonly ILogger<AdminService> _logger;

        public AdminService(ApplicationDbContext context, IDocumentService documentService, ILogger<AdminService> logger)
        {
            _context = context;
            _documentService = documentService;
            _logger = logger;
        }

        public async Task<Position> CreatePositionAsync(string title, string? description, int maxVotes = 1)
        {
            var position = new Position
            {
                Title = title,
                Description = description,
                MaxVotes = maxVotes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();
            return position;
        }

        public async Task<Candidate> CreateCandidateAsync(string fullName, string? matricNumber, string? nickName, int positionId, IFormFile? image = null)
        {
            try
            {
                string? imageUrl = null;

                if (image != null)
                {
                    imageUrl = await _documentService.UploadImageToCloudinaryAsync(image);
                }

                var existingCandidate = await _context.Candidates
                    .FirstOrDefaultAsync(c => c.MatricNumber == matricNumber);

                if (existingCandidate != null)
                {
                    _logger.LogWarning("Candidate with matric number {MatricNumber} already exists.", matricNumber);
                    return null;
                }

                var candidate = new Candidate
                {
                    FullName = fullName,
                    MatricNumber = matricNumber,
                    NickName = nickName,
                    PositionId = positionId,
                    ImageUrl = imageUrl,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Candidates.Add(candidate);
                await _context.SaveChangesAsync();

                return candidate;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating a candidate.");
                throw; 
            }
        }


        public async Task<VotingSession> CreateVotingSessionAsync(string title, string? description, DateTime startTime, DateTime endTime, int createdByUserId)
        {
            var session = new VotingSession
            {
                Title = title,
                Description = description,
                StartTime = startTime,
                EndTime = endTime,
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.VotingSessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<bool> StartVotingAsync(int sessionId)
        {
            try
            {
                // Deactivate all other sessions
                var allSessions = await _context.VotingSessions.ToListAsync();
                foreach (var session in allSessions)
                {
                    session.IsActive = false;
                }

                // Activate the specified session
                var targetSession = await _context.VotingSessions.FindAsync(sessionId);
                if (targetSession == null) return false;

                targetSession.IsActive = true;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Voting session {sessionId} started successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting voting session {sessionId}");
                return false;
            }
        }

        public async Task<bool> EndVotingAsync(int sessionId)
        {
            try
            {
                var session = await _context.VotingSessions.FindAsync(sessionId);
                if (session == null) return false;

                session.IsActive = false;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Voting session {sessionId} ended successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ending voting session {sessionId}");
                return false;
            }
        }

        public async Task<IEnumerable<object>> GetAllPositionsAsync()
        {
            var positions = await _context.Positions
                .Include(p => p.Candidates)
                .OrderBy(p => p.Title)
                .ToListAsync(); // Still async here

            var data = positions.Select(p => new
            {
                p.Id,
                p.Title,
                p.MaxVotes,
                Candidates = (p.Candidates ?? new List<Candidate>())
                    .Select(c => new
                    {
                        c.Id,
                        c.FullName,
                        c.NickName,
                        c.ImageUrl
                    })
                    .ToList()
            });

            return data;
        }



        public async Task<IEnumerable<object>> GetAllCandidatesAsync()
        {
            var candidates = await _context.Candidates
                .Include(c => c.Position)
                .ToListAsync();

            var data = candidates
                .OrderBy(c => c.Position?.Title ?? "")
                .ThenBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.FullName,
                    c.NickName,
                    c.ImageUrl,
                    PositionTitle = c.Position?.Title ?? "Unknown"
                });

            return data;
        }


        public async Task<IEnumerable<object>> GetAllVotingSessionsAsync()
        {
            var sessions = await _context.VotingSessions
                .Include(vs => vs.CreatedBy)
                .ToListAsync(); 

            var data = sessions
                .OrderByDescending(vs => vs.CreatedAt)
                .Select(vs => new
                {
                    vs.Id,
                    vs.Title,
                    vs.Description,
                    vs.StartTime,
                    vs.EndTime,
                    vs.IsActive,
                    vs.CreatedAt,
                    CreatedBy = vs.CreatedBy != null
                        ? new
                        {
                            vs.CreatedBy.Id,
                            vs.CreatedBy.FullName,
                            vs.CreatedBy.Email
                        }
                        : null
                });

            return data;
        }




        public async Task<Dictionary<int, Dictionary<int, int>>> GetDetailedVoteResultsAsync()
        {
            var results = new Dictionary<int, Dictionary<int, int>>();

            var positions = await _context.Positions
                .Include(p => p.Candidates)
                .ThenInclude(c => c.Votes)
                .ToListAsync();

            foreach (var position in positions)
            {
                var positionResults = new Dictionary<int, int>();
                foreach (var candidate in position.Candidates)
                {
                    positionResults[candidate.Id] = candidate.Votes.Count;
                }
                results[position.Id] = positionResults;
            }

            return results;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .OrderBy(u => u.FullName)
                .ToListAsync();
        }

        public async Task<bool> DeletePositionAsync(int positionId)
        {
            try
            {
                var position = await _context.Positions
                    .Include(p => p.Candidates)
                    .Include(p => p.Votes)
                    .FirstOrDefaultAsync(p => p.Id == positionId);

                if (position == null) return false;

                // Check if there are any votes for this position
                if (position.Votes.Any())
                {
                    _logger.LogWarning($"Cannot delete position {positionId} - votes exist");
                    return false;
                }

                _context.Positions.Remove(position);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting position {positionId}");
                return false;
            }
        }

        public async Task<bool> DeleteCandidateAsync(int candidateId)
        {
            try
            {
                var candidate = await _context.Candidates
                    .Include(c => c.Votes)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null) return false;

                // Check if there are any votes for this candidate
                if (candidate.Votes.Any())
                {
                    _logger.LogWarning($"Cannot delete candidate {candidateId} - votes exist");
                    return false;
                }

                _context.Candidates.Remove(candidate);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting candidate {candidateId}");
                return false;
            }
        }
    }
}