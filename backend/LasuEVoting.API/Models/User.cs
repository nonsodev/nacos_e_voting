using System.ComponentModel.DataAnnotations;

namespace LasuEVoting.API.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        public string? MatricNumber { get; set; }
        
        [Required]
        public string GoogleId { get; set; } = string.Empty;
        
        public string? ProfileImageUrl { get; set; }
        
        public bool IsActivated { get; set; } = false;
        
        public bool IsAdmin { get; set; } = false;
        
        public string? DocumentUrl { get; set; }
        
        public bool DocumentVerified { get; set; } = false;
        
        public bool FaceVerified { get; set; } = false;
        
        public string? SkyBiometryUid { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Vote> Votes { get; set; } = new List<Vote>();
    }
}