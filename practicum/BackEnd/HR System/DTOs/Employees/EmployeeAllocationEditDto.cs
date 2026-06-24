using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record EmployeeAllocationEditDto
    {
        public string SystemId { get; init; } = null!;
        public string? RoleInSystem { get; init; }
        public int? PlannedMonths { get; init; }
        public int? ActualMonths { get; init; }
    }
}
