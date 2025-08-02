using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using LasuEVoting.API.Models;
using System.Text;

namespace LasuEVoting.API.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(IOptions<CloudinarySettings> cloudinarySettings, ILogger<DocumentService> logger)
        {
            var account = new Account(
                cloudinarySettings.Value.CloudName,
                cloudinarySettings.Value.ApiKey,
                cloudinarySettings.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
            _logger = logger;
        }

        public async Task<(bool verified, string? documentUrl)> VerifyAndUploadDocumentAsync(IFormFile document, string matricNumber, string fullName)
        {
            try
            {
                // Validate file
                if (document == null || document.Length == 0)
                    return (false, null);

                if (document.ContentType != "application/pdf")
                    return (false, null);

                if (document.Length > 10 * 1024 * 1024) // 10MB
                    return (false, null);

                // Upload to Cloudinary
                var documentUrl = await UploadPdfToCloudinaryAsync(document);
                if (string.IsNullOrEmpty(documentUrl))
                    return (false, null);

                // Verify document content
                var isVerified = await VerifyDocumentContentAsync(documentUrl, matricNumber, fullName);

                return (isVerified, documentUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying and uploading document");
                return (false, null);
            }
        }
        public async Task<string?> UploadPdfToCloudinaryAsync(IFormFile file, string folderName = "courseForms")
        {
            if (file == null || file.Length == 0)
                return null;
            if (file.ContentType.ToLower() != "application/pdf" || !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return null;
            const long maxFileSize = 10 * 1024 * 1024; // 10MB

            if (file.Length > maxFileSize)
                return null;


            await using var stream = file.OpenReadStream();
            var uploadParams = new RawUploadParams
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

        public async Task<string?> UploadImageToCloudinaryAsync(IFormFile file, string folderName = "faces")
        {
            if (file == null || file.Length == 0)
                return null;
            if (!file.ContentType.StartsWith("image/"))
                return null;
            const long maxFileSize = 10 * 1024 * 1024; // 10MB

            if (file.Length > maxFileSize)
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

        public async Task<bool> VerifyDocumentContentAsync(string documentUrl, string matricNumber, string fullName)
        {
            try
            {
                using var httpClient = new HttpClient();
                var pdfBytes = await httpClient.GetByteArrayAsync(documentUrl);

                var extractedText = ExtractTextFromPdf(pdfBytes);

                var containsMatricNumber = extractedText.Contains(matricNumber, StringComparison.OrdinalIgnoreCase);
                var containsFullName = ContainsFullName(extractedText, fullName);

                _logger.LogInformation($"Document verification - Matric: {containsMatricNumber}, Name: {containsFullName}");
                _logger.LogInformation($"Extracted text preview: {extractedText.Substring(0, Math.Min(500, extractedText.Length))}");

                return containsMatricNumber && containsFullName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying document content");
                return false;
            }
        }

        private string ExtractTextFromPdf(byte[] pdfBytes)
        {
            try
            {
                using var reader = new PdfReader(pdfBytes);
                var text = new StringBuilder();

                for (int page = 1; page <= reader.NumberOfPages; page++)
                {
                    var pageText = PdfTextExtractor.GetTextFromPage(reader, page);
                    text.AppendLine(pageText);
                }

                return text.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text from PDF");
                return string.Empty;
            }
        }

        private bool ContainsFullName(string text, string fullName)
        {
            var nameParts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var part in nameParts)
            {
                if (part.Length > 2 && !text.Contains(part, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return true;
        }
    }
}