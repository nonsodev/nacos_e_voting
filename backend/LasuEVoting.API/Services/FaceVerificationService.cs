using Microsoft.Extensions.Options;
using System.Text;
using LasuEVoting.API.Models;

namespace LasuEVoting.API.Services
{
    public class FaceVerificationService : IFaceVerificationService
    {
        private readonly SkyBiometrySettings _settings;
        private readonly IDocumentService _documentService;
        private readonly HttpClient _httpClient;
        private readonly ILogger<FaceVerificationService> _logger;

        public FaceVerificationService(
            IOptions<SkyBiometrySettings> settings,
            IDocumentService documentService,
            HttpClient httpClient,
            ILogger<FaceVerificationService> logger)
        {
            _settings = settings.Value;
            _documentService = documentService;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> VerifyAndRegisterFaceAsync(IFormFile faceImage, string matricNumber)
        {
            try
            {
                // Upload image to Cloudinary first
                var imageUrl = await _documentService.UploadToCloudinaryAsync(faceImage);
                if (string.IsNullOrEmpty(imageUrl))
                    return false;

                // Step 1: Detect face
                if (!await DetectFaceAsync(imageUrl))
                {
                    _logger.LogWarning("No face detected in image");
                    return false;
                }

                // Step 2: Check for duplicate
                if (await CheckForDuplicateFaceAsync(imageUrl))
                {
                    _logger.LogWarning("Duplicate face detected");
                    return false;
                }

                // Step 3: Save and train face
                var uid = $"{matricNumber}@{_settings.Namespace}";
                return await SaveAndTrainFaceAsync(imageUrl, uid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in face verification process");
                return false;
            }
        }

        public async Task<bool> DetectFaceAsync(string imageUrl)
        {
            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["api_key"] = _settings.ApiKey,
                    ["api_secret"] = _settings.ApiSecret,
                    ["urls"] = imageUrl
                };

                var content = new FormUrlEncodedContent(parameters);
                var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/faces/detect.json", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"Face detection response: {responseContent}");

                // Parse response to check if face was detected
                return responseContent.Contains("\"tid\"") && !responseContent.Contains("\"error\"");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting face");
                return false;
            }
        }

        public async Task<bool> CheckForDuplicateFaceAsync(string imageUrl)
        {
            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["api_key"] = _settings.ApiKey,
                    ["api_secret"] = _settings.ApiSecret,
                    ["namespace"] = _settings.Namespace,
                    ["urls"] = imageUrl
                };

                var content = new FormUrlEncodedContent(parameters);
                var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/faces/recognize.json", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"Face recognition response: {responseContent}");

                // Check if similarity is above threshold (0.85)
                if (responseContent.Contains("\"confidence\""))
                {
                    // Parse confidence value and check if it's above 85%
                    var confidenceIndex = responseContent.IndexOf("\"confidence\":");
                    if (confidenceIndex > -1)
                    {
                        var confidenceStart = responseContent.IndexOf(":", confidenceIndex) + 1;
                        var confidenceEnd = responseContent.IndexOf(",", confidenceStart);
                        if (confidenceEnd == -1) confidenceEnd = responseContent.IndexOf("}", confidenceStart);
                        
                        if (confidenceEnd > confidenceStart)
                        {
                            var confidenceStr = responseContent.Substring(confidenceStart, confidenceEnd - confidenceStart).Trim();
                            if (double.TryParse(confidenceStr, out var confidence))
                            {
                                return confidence > 85.0; // Duplicate if confidence > 85%
                            }
                        }
                    }
                }

                return false; // No duplicate found
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking for duplicate face");
                return false;
            }
        }

        public async Task<bool> SaveAndTrainFaceAsync(string imageUrl, string uid)
        {
            try
            {
                // First, detect face to get TID
                var detectParams = new Dictionary<string, string>
                {
                    ["api_key"] = _settings.ApiKey,
                    ["api_secret"] = _settings.ApiSecret,
                    ["urls"] = imageUrl
                };

                var detectContent = new FormUrlEncodedContent(detectParams);
                var detectResponse = await _httpClient.PostAsync($"{_settings.BaseUrl}/faces/detect.json", detectContent);
                var detectResponseContent = await detectResponse.Content.ReadAsStringAsync();

                // Extract TID from response
                var tidIndex = detectResponseContent.IndexOf("\"tid\":\"");
                if (tidIndex == -1) return false;

                var tidStart = tidIndex + 7;
                var tidEnd = detectResponseContent.IndexOf("\"", tidStart);
                var tid = detectResponseContent.Substring(tidStart, tidEnd - tidStart);

                // Save tag with UID
                var saveParams = new Dictionary<string, string>
                {
                    ["api_key"] = _settings.ApiKey,
                    ["api_secret"] = _settings.ApiSecret,
                    ["uid"] = uid,
                    ["tid"] = tid
                };

                var saveContent = new FormUrlEncodedContent(saveParams);
                var saveResponse = await _httpClient.PostAsync($"{_settings.BaseUrl}/tags/save.json", saveContent);
                var saveResponseContent = await saveResponse.Content.ReadAsStringAsync();

                _logger.LogInformation($"Save tag response: {saveResponseContent}");

                // Train face
                var trainParams = new Dictionary<string, string>
                {
                    ["api_key"] = _settings.ApiKey,
                    ["api_secret"] = _settings.ApiSecret,
                    ["uids"] = uid
                };

                var trainContent = new FormUrlEncodedContent(trainParams);
                var trainResponse = await _httpClient.PostAsync($"{_settings.BaseUrl}/faces/train.json", trainContent);
                var trainResponseContent = await trainResponse.Content.ReadAsStringAsync();

                _logger.LogInformation($"Train face response: {trainResponseContent}");

                return !trainResponseContent.Contains("\"error\"");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving and training face");
                return false;
            }
        }
    }
}