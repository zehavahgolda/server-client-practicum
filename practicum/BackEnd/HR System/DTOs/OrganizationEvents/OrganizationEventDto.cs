namespace HR_System.DTOs.OrganizationEvents
{
    public record OrganizationEventDto(
        string Id,
        string Title,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate,
        string ScopeType,
        List<string> TargetSystemIds,
        List<OrganizationEventTargetSystemDto> TargetSystems,
        string Status,
        DateTime CreatedAt,
        DateTime? UpdatedAt
    );
}