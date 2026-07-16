using HR_System.DTOs.OrganizationEvents;

namespace HR_System.Services
{
    public interface IOrganizationEventService
    {
        Task<List<OrganizationEventDto>> GetOrganizationEventsAsync(
            string? search = null,
            string? status = null,
            string? scopeType = null,
            string? systemId = null);

        Task<List<OrganizationEventDto>> GetOrganizationEventsForSystemAsync(string systemId);
        Task<OrganizationEventDto> CreateOrganizationEventAsync(OrganizationEventCreateDto dto);
        Task<OrganizationEventDto> UpdateOrganizationEventAsync(string id, OrganizationEventUpdateDto dto);
        Task<bool> SoftDeleteOrganizationEventAsync(string id);
    }
}