using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record EmployeeAllocationEditDto
    {
        public string SystemId { get; init; } = null!;
        public string? RoleInSystem { get; init; }
        public double? PlannedMonths { get; init; }
        public double? ActualMonths { get; init; }
    }
}
