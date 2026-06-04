using CloudinaryDotNet.Actions;
using CloudinaryDotNet;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var account = new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(account);
    }

    public async Task<string?> UploadImageAsync(IFormFile file, string folderName = "company_logos")
    {
        if (file == null || file.Length == 0)
            return null;

        await using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folderName,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        return uploadResult.StatusCode == System.Net.HttpStatusCode.OK
            ? uploadResult.SecureUrl.ToString()
            : null;
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var deletionParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deletionParams);
    }

    public async Task<string?> ReplaceImageAsync(IFormFile newFile, string oldImageUrl, string folderName = "company_logos")
    {
        if (!string.IsNullOrEmpty(oldImageUrl))
        {
            var publicId = ExtractPublicId(oldImageUrl);
            if (!string.IsNullOrEmpty(publicId))
            {
                await DeleteImageAsync(publicId);
            }
        }

        return await UploadImageAsync(newFile, folderName);
    }

    private string? ExtractPublicId(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
            return null;

        try
        {
            var uri = new Uri(imageUrl);
            var segments = uri.AbsolutePath.Split('/');
            var fileName = segments.Last(); 
            var folder = segments[^2];
            var publicId = $"{folder}/{Path.GetFileNameWithoutExtension(fileName)}";
            return publicId;
        }
        catch
        {
            return null;
        }
    }

}
