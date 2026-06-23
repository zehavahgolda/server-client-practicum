namespace HR_System.DTOs.Employees
{
    /// <summary>
    /// DTO for displaying full employee details with allocation history and notes.
    /// Extends EmployeeListItemDto with additional fields.
    /// </summary>
    public record EmployeeDetailsDto(
        string Id,
        string FullName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        string ManagerName,
        int Year,
        int YearlyCapacityMonths,//קיבולת שנתית לעבוד
        int AllocatedMonths,//חודשים מוקצים
        int RemainingMonths,//  יתרת חודשים, חודשים פנויים
        string AvailabilityStatus,// סטטוס זמינות
        int AssignedSystemsCount,
        string? UpcomingEvent,
        string? Notes,
        string? ManagerReviewNote,
        List<EmployeeRelevantChangeDto> RelevantChanges,
        List<EmployeeAllocationDto> Allocations
    );
}
