namespace HR_System.DTOs.Employees
{
    public record EmployeeEventCreateDto(
        string EventType,
        string? CustomEventType,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate
    );
}