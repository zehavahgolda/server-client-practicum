using System.Collections.Generic;

namespace HR_System.DTOs.Employees
{
    public record EmployeeDetailsDto(
        string Id,
        string FullName,
        string ManagerName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        int Year,
        double YearlyCapacityMonths,
        string? UpcomingEvent,
        double AllocatedMonths,
        double RemainingMonths,
        string AvailabilityStatus,
        int AssignedSystemsCount,
        bool IsActive,
        string? Notes,
        string? ManagerReviewNote,
        List<EmployeeRelevantChangeDto> RelevantChanges,
        List<EmployeeAllocationDto> Allocations
    );
}