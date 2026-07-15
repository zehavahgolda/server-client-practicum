using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    public interface IEmployeeEventService
    {
        Task<List<EmployeeEventDto>> GetEmployeeEventsAsync(string employeeId);
        Task<EmployeeEventBatchResponseDto> GetEmployeeEventsBatchAsync(EmployeeEventBatchRequestDto? request);
        Task<EmployeeEventDto> CreateEmployeeEventAsync(string employeeId, EmployeeEventCreateDto dto);
        Task<EmployeeEventDto> UpdateEmployeeEventAsync(string employeeId, string eventId, EmployeeEventUpdateDto dto);
        Task<bool> SoftDeleteEmployeeEventAsync(string employeeId, string eventId);
    }
}