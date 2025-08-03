using System.ComponentModel.DataAnnotations;

namespace LasuEVoting.API.Models
{
    public class Candidate
    {
        public int Id { get; set; }
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        public string MatricNumber { get; set; }
        
        public string NickName { get; set; }
        
        public string ImageUrl { get; set; }
        
        public int PositionId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual Position Position { get; set; } 
        public virtual ICollection<Vote> Votes { get; set; } 
    }
}