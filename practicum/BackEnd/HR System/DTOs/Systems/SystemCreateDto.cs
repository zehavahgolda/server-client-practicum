// DTO used when creating a new system via API.
namespace HR_System.DTOs.Systems
{
    public class SystemCreateDto
    {
        public string Name { get; set; } = null!;
        public string? OwnerManagerName { get; set; }
        public int Year { get; set; }
        public int RequiredCapacityMonths { get; set; }
        public string? ManagementNote { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
