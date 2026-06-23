namespace HR_System.DTOs.Systems
{
   
    public record SystemAssignedEmployeeDto(
        string EmployeeId,
        string FullName,
        string ProfessionalCategory,
        string? ProfessionalSubCategory,
        string ManagerName,
        string RoleInSystem,
        int PlannedMonths,
        int ActualMonths,
        string AvailabilityStatus //אולי יהיה שימושי לצבעים.. לשאול את חני 
    );
}
