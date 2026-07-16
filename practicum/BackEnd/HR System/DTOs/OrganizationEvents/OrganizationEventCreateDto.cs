namespace HR_System.DTOs.OrganizationEvents
{
    public record OrganizationEventCreateDto
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public DateOnly StartDate { get; init; }
        public DateOnly? EndDate { get; init; }
        public string? ScopeType { get; init; }
        public List<string>? TargetSystemIds { get; init; }
    }
}