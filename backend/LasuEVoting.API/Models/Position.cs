using System.ComponentModel.DataAnnotations;

namespace LasuEVoting.API.Models
{
    public class Position
    {
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int MaxVotes { get; set; } = 1; // Number of candidates a voter can select for this position
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Candidate> Candidates { get; set; } = new List<Candidate>();
        public virtual ICollection<Vote> Votes { get; set; } = new List<Vote>();
    }
}