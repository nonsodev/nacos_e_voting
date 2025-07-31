using System.ComponentModel.DataAnnotations;

namespace LasuEVoting.API.Models
{
    public class VotingSession
    {
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public DateTime StartTime { get; set; }
        
        public DateTime EndTime { get; set; }
        
        public bool IsActive { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public int CreatedByUserId { get; set; }

        // Navigation properties
        public virtual User CreatedBy { get; set; } = null!;
    }
}