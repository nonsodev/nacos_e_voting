namespace LasuEVoting.API.Models
{
    public class GoogleAuthSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }

    public class CloudinarySettings
    {
        public string CloudName { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ApiSecret { get; set; } = string.Empty;
    }

    public class SkyBiometrySettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string ApiSecret { get; set; } = string.Empty;
        public string Namespace { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
    }

    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public int ExpiryInDays { get; set; } = 7;
    }
}