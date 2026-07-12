namespace HR_System.DTOs.Employees
{
    public record BulkAssignEmployeesDto(
        string SystemId,
        List<EmployeeAssignmentItemDto> Employees
    );

    public record EmployeeAssignmentItemDto(
        string EmployeeId,
        string RoleInSystem,
        double PlannedMonths,
        double ActualMonths
    );

    public record BulkAssignEmployeesResultDto(
        bool IsSuccess,
        int AssignedCount,
        List<string> Errors
    );
}