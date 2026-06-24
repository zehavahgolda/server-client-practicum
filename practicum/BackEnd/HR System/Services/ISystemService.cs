using HR_System.DTOs.Systems;

namespace HR_System.Services
{
    public interface ISystemService
    {
        Task<List<SystemListItemDto>> GetSystemsAsync(int? year = null, string? status = null, string? ownerManagerName = null, string? search = null);
        Task<List<SystemListItemDto>> GetSystemsWithShortageAsync();
        Task<SystemDetailsDto?> GetSystemByIdAsync(string id);

        Task<byte[]> ExportSystemsToExcelAsync(int? year = null, string? status = null);
        Task CreateSystemAsync(SystemCreateDto dto);
        Task UpdateSystemAsync(string id, SystemCreateDto dto);
        Task DeleteSystemAsync(string id);
    }
}