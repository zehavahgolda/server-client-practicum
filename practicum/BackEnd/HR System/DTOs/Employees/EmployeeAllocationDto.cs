namespace HR_System.DTOs.Employees
{
 
    public record EmployeeAllocationDto(
        string SystemId,
        string SystemName,
        string SystemCapacityStatus,
        string RoleInSystem,
        int PlannedMonths,
        int ActualMonths
    );
}
