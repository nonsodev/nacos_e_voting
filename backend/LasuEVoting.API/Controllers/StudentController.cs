using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LasuEVoting.API.Services;
using LasuEVoting.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LasuEVoting.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IDocumentService _documentService;
        private readonly IFaceVerificationService _faceVerificationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StudentController> _logger;

        public StudentController(
            IAuthService authService,
            IDocumentService documentService,
            IFaceVerificationService faceVerificationService,
            ApplicationDbContext context,
            ILogger<StudentController> logger)
        {
            _authService = authService;
            _documentService = documentService;
            _faceVerificationService = faceVerificationService;
            _context = context;
            _logger = logger;
        }

        [HttpPost("update-details")]
        public async Task<IActionResult> UpdateDetails([FromBody] UpdateDetailsRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var success = await _authService.UpdateDetailsNumberAsync(userId, request.MatricNumber,request.FullName);

                if (!success)
                    return BadRequest(new { message = "Failed to update matric number. It may already be in use." });

                return Ok(new { message = "Matric number updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating matric number");
                return BadRequest(new { message = "Failed to update matric number" });
            }
        }

        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile document, [FromForm] string matricNumber)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                var (verified, documentUrl) = await _documentService.VerifyAndUploadDocumentAsync(
                    document, matricNumber, user.FullName);

                if (!verified || string.IsNullOrEmpty(documentUrl))
                    return BadRequest(new { message = "Document verification failed" });

                // Update user record
                user.DocumentUrl = documentUrl;
                user.DocumentVerified = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { verified = true, message = "Document verified successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return BadRequest(new { message = "Document upload failed" });
            }
        }

        [HttpPost("verify-face")]
        public async Task<IActionResult> VerifyFace([FromForm] IFormFile faceImage, [FromForm] string matricNumber)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (!user.DocumentVerified)
                    return BadRequest(new { message = "Document must be verified first" });

                var verified = await _faceVerificationService.VerifyAndRegisterFaceAsync(faceImage, matricNumber);

                if (!verified)
                    return BadRequest(new { message = "Face verification failed" });

                // Update user record
                user.FaceVerified = true;
                user.IsActivated = true; // Account is now fully activated
                user.SkyBiometryUid = $"{matricNumber}@nacos_e_voting";
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { verified = true, message = "Face verification successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying face");
                return BadRequest(new { message = "Face verification failed" });
            }
        }

        [HttpGet("verification-status")]
        public async Task<IActionResult> GetVerificationStatus()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new
                {
                    hasMatricNumber = !string.IsNullOrEmpty(user.MatricNumber),
                    documentVerified = user.DocumentVerified,
                    faceVerified = user.FaceVerified,
                    isActivated = user.IsActivated
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verification status");
                return BadRequest(new { message = "Failed to get verification status" });
            }
        }
    }

    public class UpdateDetailsRequest
    {
        public string MatricNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}