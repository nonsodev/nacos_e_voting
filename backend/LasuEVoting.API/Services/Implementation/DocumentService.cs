using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using LasuEVoting.API.Models;
using System.Text;
using LasuEVoting.API.Services.Interfaces;

namespace LasuEVoting.API.Services.Implementation
{
    public class DocumentService : IDocumentService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(IOptions<CloudinarySettings> cloudinarySettings, ILogger<DocumentService> logger )
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
                if (document == null || document.Length == 0)
                    return (false, null);

                if (document.ContentType != "application/pdf")
                    return (false, null);

                if (document.Length > 10 * 1024 * 1024) // 10MB
                    return (false, null);

                var isVerified = await VerifyDocumentContentAsync(document, matricNumber, fullName);
                if (!isVerified)
                    return (false, null);

                var documentUrl = await UploadPdfToCloudinaryAsync(document);

                if (string.IsNullOrEmpty(documentUrl))
                    return (false, null);

                return (true, documentUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying and uploading document");
                return (false, null);
            }
        }

        public async Task<(bool verified, string? documentUrl)> VerifyAndReplaceDocumentAsync(IFormFile document, string imageUrl, string matricNumber, string fullName)
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

                var isVerified = await VerifyDocumentContentAsync(document, matricNumber, fullName);
                if (!isVerified)
                    return (false, null);

                var documentUrl = await ReplaceDocumentAsync(document, imageUrl);

                if (string.IsNullOrEmpty(documentUrl))
                    return (false, null);

                return (true, documentUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying and uploading document");
                return (false, null);
            }
        }

        private async Task<string?> UploadPdfToCloudinaryAsync(IFormFile file, string folderName = "courseForms")
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.ContentType.ToLower() != "application/pdf" || !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return null;

            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (file.Length > maxFileSize)
                return null;

            try
            {
                _logger.LogInformation("Starting PDF upload for file: {FileName}, ContentType: {ContentType}",
                    file.FileName, file.ContentType);

                await using var stream = file.OpenReadStream();

                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "courseForms",
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false
                };
                _logger.LogInformation("Upload params created. Folder: {Folder}, UseFilename: {UseFilename}",
                    folderName, uploadParams.UseFilename);

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                _logger.LogInformation("Upload completed. Status: {Status}, ResourceType: {ResourceType}, URL: {Url}",
                    uploadResult.StatusCode, uploadResult.ResourceType, uploadResult.SecureUrl?.ToString());

                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    var url = uploadResult.SecureUrl?.ToString();

                    if (url != null && url.Contains("/raw/upload/"))
                    {
                        _logger.LogInformation("PDF uploaded successfully with correct raw URL: {Url}", url);
                        return url;
                    }
                    else
                    {
                        _logger.LogWarning("PDF uploaded but URL format is incorrect: {Url}", url);
                        return url;
                    }
                }

                _logger.LogError("PDF upload failed. Status: {Status}, Error: {Error}",
                    uploadResult.StatusCode, uploadResult.Error?.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception during PDF upload");
                return null;
            }
        }

        private async Task<string?> ReplaceDocumentAsync(IFormFile newFile, string oldImageUrl, string folderName = "courseForms")
        {
            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                var publicId = ExtractPublicId(oldImageUrl);
                if (!string.IsNullOrEmpty(publicId))
                {
                    await DeleteImageAsync(publicId);
                }
            }

            return await UploadPdfToCloudinaryAsync(newFile, folderName);
        }
        public async Task DeleteImageAsync(string publicId)
        {
            var deletionParams = new DeletionParams(publicId);
            await _cloudinary.DestroyAsync(deletionParams);
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
                var publicId = $"{folder}/{System.IO.Path.GetFileNameWithoutExtension(fileName)}";
                return publicId;
            }
            catch
            {
                return null;
            }
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

        public async Task<bool> VerifyDocumentContentAsync(IFormFile file, string matricNumber, string fullName)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var pdfBytes = memoryStream.ToArray();

                var extractedText = ExtractTextFromPdf(pdfBytes);

                var containsMatricNumber = extractedText.Contains(matricNumber, StringComparison.OrdinalIgnoreCase);
                var containsFullName = ContainsFullName(extractedText, fullName);

                if (!containsMatricNumber)
                    return false;

                if (!containsFullName)
                    return false;

                if (!IsMatricNumberAllowed(matricNumber))
                    return false;

                _logger.LogInformation("Text extraction succeeded");
                return true;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying document content from stream");
                return false;
            }
        }

        private readonly List<string> _excludedMatricNumbers = new()
        {
            "21", "240591174", "251911066", "251911206", "230591151", "240591257", "220591278", "230591327", "230591364", "220591123"
        };

        private readonly List<string> _allowedTransferredMatricNumbers = new()
        {
            "2105","2101",
        };

        private bool IsValidDepartmentalMatricNumber(string matricNumber)
        {
            if (matricNumber.Length != 9)
                return false;

            var yearPart = matricNumber.Substring(0, 2);
            var deptCode = matricNumber.Substring(2, 4);
            var personalNumber = matricNumber.Substring(6, 3);

            return int.TryParse(yearPart, out var year) &&
                (
                    ((year >= 22 && year <= 24) && deptCode == "0591") ||
                    (year == 25 && deptCode == "1911")
                ) &&
                int.TryParse(personalNumber, out _);
            }

        private bool IsMatricNumberAllowed(string matricNumber)
        {
            if (_excludedMatricNumbers.Contains(matricNumber))
                return false;

            if (_allowedTransferredMatricNumbers.Contains(matricNumber))
                return true;

            if (!IsValidDepartmentalMatricNumber(matricNumber))
                return false;

            return IsCurrentMatricNumber(matricNumber);
        }


        private bool IsCurrentMatricNumber(string matricNumber)
        {
            if (matricNumber.Length < 9) return false;

            var yearPart = matricNumber.Substring(0, 2);

            if (int.TryParse(yearPart, out int year))
            {
                return year >= 22 && year <= 25;
            }

            return false;
        }


        private string ExtractTextFromPdf(byte[] pdfBytes)
        {
            try
            {
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

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
            if (string.IsNullOrWhiteSpace(fullName))
                return false;

            var normalizedText = Normalize(text);
            var nameParts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                                    .Select(Normalize)
                                    .ToArray();

            bool allPartsPresent = nameParts.All(part => normalizedText.Contains(part));
            if (!allPartsPresent)
                return false;

            var permutations = GetPermutations(nameParts);
            foreach (var permutation in permutations)
            {
                var combined = Normalize(string.Join(" ", permutation));
                if (normalizedText.Contains(combined))
                    return true;
            }

            return true;
        }



        private string Normalize(string input)
        {
            return new string(input
                .Where(c => !char.IsPunctuation(c))
                .ToArray())
                .ToLower()
                .Trim();
        }


        private List<string[]> GetPermutations(string[] array)
        {
            var result = new List<string[]>();
            Permute(array, 0, result);
            return result;
        }

        private void Permute(string[] array, int start, List<string[]> result)
        {
            if (start >= array.Length)
            {
                result.Add((string[])array.Clone());
                return;
            }

            for (int i = start; i < array.Length; i++)
            {
                (array[start], array[i]) = (array[i], array[start]);
                Permute(array, start + 1, result);
                (array[start], array[i]) = (array[i], array[start]);
            }
        }


    }
}