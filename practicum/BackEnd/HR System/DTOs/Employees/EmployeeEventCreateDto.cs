namespace HR_System.DTOs.Employees
{
    public record EmployeeEventCreateDto(
        string EventType,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate
    );
}