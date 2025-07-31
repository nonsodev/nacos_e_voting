namespace LasuEVoting.API.Services
{
    public interface IFaceVerificationService
    {
        Task<bool> VerifyAndRegisterFaceAsync(IFormFile faceImage, string matricNumber);
        Task<bool> DetectFaceAsync(string imageUrl);
        Task<bool> CheckForDuplicateFaceAsync(string imageUrl);
        Task<bool> SaveAndTrainFaceAsync(string imageUrl, string uid);
    }
}