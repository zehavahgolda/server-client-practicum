namespace HR_System.DTOs.Employees
{
    public record EmployeeAssignmentCandidateDto(
        string Id,
        string FullName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        string ManagerName,
        double YearlyCapacityMonths,
        double AllocatedMonths,
        double RemainingMonths,
        string AvailabilityStatus,
        int AssignedSystemsCount,
        bool AlreadyAssignedToSystem,
        bool CanAssign
    );
}