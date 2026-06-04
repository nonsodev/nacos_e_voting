public interface ICloudinaryService
{
    Task<string?> UploadImageAsync(IFormFile file, string folderName = "company_logos");
    Task DeleteImageAsync(string publicId);
    Task<string?> ReplaceImageAsync(IFormFile newFile, string oldImageUrl, string folderName = "company_logos");
}
