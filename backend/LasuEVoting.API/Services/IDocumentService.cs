namespace LasuEVoting.API.Services
{
    public interface IDocumentService
    {
        Task<(bool verified, string? documentUrl)> VerifyAndUploadDocumentAsync(IFormFile document, string matricNumber, string fullName);
        Task<(bool verified, string? documentUrl)> VerifyAndReplaceDocumentAsync(IFormFile document, string imageUrl, string matricNumber, string fullName);
        Task<string?> UploadImageToCloudinaryAsync(IFormFile file, string folderName = "faces");
    }
}