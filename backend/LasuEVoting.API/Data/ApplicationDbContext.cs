using Microsoft.EntityFrameworkCore;
using LasuEVoting.API.Models;

namespace LasuEVoting.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<VotingSession> VotingSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.GoogleId).IsUnique();
                entity.HasIndex(e => e.MatricNumber).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.GoogleId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.MatricNumber).HasMaxLength(50);
            });

            // Position configuration
            modelBuilder.Entity<Position>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
            });

            // Candidate configuration
            modelBuilder.Entity<Candidate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.MatricNumber).HasMaxLength(50);
                entity.Property(e => e.Biography).HasMaxLength(2000);
                
                entity.HasOne(e => e.Position)
                      .WithMany(p => p.Candidates)
                      .HasForeignKey(e => e.PositionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Vote configuration
            modelBuilder.Entity<Vote>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.User)
                      .WithMany(u => u.Votes)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Position)
                      .WithMany(p => p.Votes)
                      .HasForeignKey(e => e.PositionId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Candidate)
                      .WithMany(c => c.Votes)
                      .HasForeignKey(e => e.CandidateId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Ensure a user can only vote once per position
                entity.HasIndex(e => new { e.UserId, e.PositionId }).IsUnique();
            });

            // VotingSession configuration
            modelBuilder.Entity<VotingSession>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
                
                entity.HasOne(e => e.CreatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Email = "finestdan1979@gmail.com",
                    FullName = "System Administrator",
                    GoogleId = "admin-google-id",
                    IsAdmin = true,
                    IsActivated = true,
                    CreatedAt = DateTime.UtcNow
                }
            );
        }
    }
}