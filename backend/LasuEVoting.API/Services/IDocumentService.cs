namespace LasuEVoting.API.Services
{
    public interface IDocumentService
    {
        Task<(bool verified, string? documentUrl)> VerifyAndUploadDocumentAsync(IFormFile document, string matricNumber, string fullName);
        Task<string> UploadToCloudinaryAsync(IFormFile file);
        Task<bool> VerifyDocumentContentAsync(string documentUrl, string matricNumber, string fullName);
    }
}