using System.Text.Json;

namespace LasuEVoting.API.Services
{
    public class GeminiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public GeminiClient(HttpClient httpClient, string apiKey, string model = "gemini-2.5-flash")
        {
            _httpClient = httpClient;
            _apiKey = apiKey;
            _model = model;
        }

        public byte[] ConvertSinglePagePdfToImage(byte[] pdfBytes)
        {
            using var stream = new MemoryStream(pdfBytes);
            using var document = PdfiumViewer.PdfDocument.Load(stream);

            using var image = document.Render(0, 300, 300, true);
            using var ms = new MemoryStream();
            image.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
            return ms.ToArray();
        }

        public async Task<string> GenerateContentFromImageAsync(byte[] pdfBytes, string fullName, string matricNumber)
        {
            var imageBytes = ConvertSinglePagePdfToImage(pdfBytes);
            var base64Image = Convert.ToBase64String(imageBytes);
            var prompt = $"Read the attached document and tell me if the name '{fullName}' and matric number '{matricNumber}' are clearly present in any order.";
            var request = new
            {
                contents = new[]
                {
            new
            {
                role = "user",
                parts = new object[]
                {
                    new { text = prompt },
                    new
                    {
                        inline_data = new
                        {
                            mime_type = "image/jpeg", // or "image/png" depending on your image format
                            data = base64Image
                        }
                    }
                }
            }
        }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            try
            {
                using var response = await _httpClient.PostAsJsonAsync(url, request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return $"[Gemini Error] Status: {response.StatusCode}, Details: {errorContent}";
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var text = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    return string.IsNullOrWhiteSpace(text) ? "[Gemini] Empty response." : text.Trim();
                }

                return "[Gemini] No candidates returned.";
            }
            catch (Exception ex)
            {
                return $"[Gemini Exception] {ex.Message}";
            }
        }
    }
}