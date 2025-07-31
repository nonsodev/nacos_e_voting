using System.ComponentModel.DataAnnotations;

namespace LasuEVoting.API.Models
{
    public class Vote
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        
        public int PositionId { get; set; }
        
        public int CandidateId { get; set; }
        
        public DateTime VotedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Position Position { get; set; } = null!;
        public virtual Candidate Candidate { get; set; } = null!;
    }
}