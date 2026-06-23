using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    public interface IEmployeeService
    {
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null);
        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

        Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths);
    }
}