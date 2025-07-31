using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using LasuEVoting.API.Models;

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
                var documentUrl = await UploadToCloudinaryAsync(document);
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

        public async Task<string> UploadToCloudinaryAsync(IFormFile file)
        {
            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new RawUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "course-forms",
                    ResourceType = ResourceType.Raw
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl?.ToString() ?? string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading to Cloudinary");
                return string.Empty;
            }
        }

        public async Task<bool> VerifyDocumentContentAsync(string documentUrl, string matricNumber, string fullName)
        {
            try
            {
                // Download PDF from Cloudinary
                using var httpClient = new HttpClient();
                var pdfBytes = await httpClient.GetByteArrayAsync(documentUrl);

                // Extract text from PDF
                var extractedText = ExtractTextFromPdf(pdfBytes);

                // Verify that the document contains the matric number and full name
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
            // Split full name into parts and check if all parts are present
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