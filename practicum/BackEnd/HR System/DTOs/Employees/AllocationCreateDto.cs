// DTO for creating a new allocation for an employee.
using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record AllocationCreateDto
    {
        public string SystemId { get; init; } = null!;
        public string RoleInSystem { get; init; } = null!;
        public int PlannedMonths { get; init; }
        public int ActualMonths { get; init; }
    }
}
