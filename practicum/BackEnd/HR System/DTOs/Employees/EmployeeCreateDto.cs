using System.Collections.Generic;

namespace HR_System.DTOs.Employees
{
    public record EmployeeCreateDto
    {
        public string FullName { get; init; } = null!;
        public string ProfessionalCategory { get; init; } = null!;
        public string? ProfessionalSubCategory { get; init; }
        public string ManagerName { get; init; } = null!;
        public int Year { get; init; }
        public int YearlyCapacityMonths { get; init; } = 12;
        public string? UpcomingEvent { get; init; }
        public string? Notes { get; init; }
        public bool IsActive { get; init; } = true;
        public List<AllocationCreateDto>? Allocations { get; init; }//נראה לי זה STO מיותר 
    }
}