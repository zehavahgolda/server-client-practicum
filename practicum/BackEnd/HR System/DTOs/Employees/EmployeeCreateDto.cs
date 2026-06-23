// DTO used when creating a new employee from the API.
// Includes basic employee fields and optional initial allocations.
namespace HR_System.DTOs.Employees
{
    public class EmployeeCreateDto
    {
        public string FullName { get; set; } = null!;
        public string ProfessionalCategory { get; set; } = null!;
        public string? ProfessionalSubCategory { get; set; }
        public string ManagerName { get; set; } = null!;
        public int Year { get; set; }
        public int YearlyCapacityMonths { get; set; } = 12;
        public string? UpcomingEvent { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;

        // Optional initial allocations when creating an employee.
        public List<AllocationCreateDto>? Allocations { get; set; }
    }
}
