namespace HR_System.DTOs.Managers
{
    public record ManagerListItemDto(
        string DesignationId,
        string EmployeeId,
        string FullName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        bool IsActive,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        DateTime? DeactivatedAt,
        int AssignedEmployeesCount
    );

    public record ManagerCreateDto
    {
        public string EmployeeId { get; init; } = null!;
    }

    public record ManagerMutationResultDto(
        string ResultType,
        string Message,
        ManagerListItemDto Manager
    );

    public record ManagerCandidateDto(
        string EmployeeId,
        string FullName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        bool HasActiveDesignation,
        bool HasInactiveDesignation
    );

    public record ManagerDeactivateResultDto(
        bool Success,
        int AffectedEmployeesCount,
        string Message,
        ManagerListItemDto? Manager
    );
}
