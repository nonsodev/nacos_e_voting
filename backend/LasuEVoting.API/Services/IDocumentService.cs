namespace LasuEVoting.API.Services
{
    public interface IDocumentService
    {
        Task<(bool verified, string? documentUrl)> VerifyAndUploadDocumentAsync(IFormFile document, string matricNumber, string fullName);
        Task<string?> UploadImageToCloudinaryAsync(IFormFile file, string folderName = "faces");
        Task<string?> UploadPdfToCloudinaryAsync(IFormFile file, string folderName = "courseForms");
        Task<bool> VerifyDocumentContentAsync(string documentUrl, string matricNumber, string fullName);
    }
}