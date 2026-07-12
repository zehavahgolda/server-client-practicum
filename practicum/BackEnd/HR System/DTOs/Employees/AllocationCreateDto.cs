// DTO for creating a new allocation for an employee.
using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record AllocationCreateDto
    {
        public string SystemId { get; init; } = null!;
        public string RoleInSystem { get; init; } = null!;
        public double PlannedMonths { get; init; }
        public double ActualMonths { get; init; }
    }
}
