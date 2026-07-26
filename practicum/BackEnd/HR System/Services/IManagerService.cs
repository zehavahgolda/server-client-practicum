using HR_System.DTOs.Managers;

namespace HR_System.Services
{
    public interface IManagerService
    {
        Task<List<ManagerListItemDto>> GetManagersAsync(string? status = null, string? search = null);
        Task<List<ManagerCandidateDto>> GetManagerCandidatesAsync(string? search = null);
        Task<ManagerMutationResultDto> AddManagerAsync(ManagerCreateDto dto);
        Task<ManagerDeactivateResultDto> DeactivateManagerAsync(string designationId, string? deactivationReason = null);
        Task<ManagerMutationResultDto> ReactivateManagerAsync(string designationId);
    }
}
