// DTO used when updating an existing employee.
using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record EmployeeEditDto
    {
        public string? FullName { get; init; }
        public string? ProfessionalCategory { get; init; }
        public string? ProfessionalSubCategory { get; init; }
        public string? ManagerName { get; init; }
        public int? Year { get; init; }
        public int? YearlyCapacityMonths { get; init; } // קיבולת שנתית
        public string? UpcomingEvent { get; init; }
        public string? Notes { get; init; }
        public bool? IsActive { get; init; }
        public List<EmployeeAllocationEditDto>? Allocations { get; init; }
    }
}
