// DTO for creating a new allocation for an employee.
namespace HR_System.DTOs.Employees
{
    public class AllocationCreateDto
    {
        public string SystemId { get; set; } = null!;
        public string RoleInSystem { get; set; } = null!;
        public int PlannedMonths { get; set; }
        public int ActualMonths { get; set; }
    }
}
