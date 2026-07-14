namespace HR_System.DTOs.Employees
{
    public record EmployeeEventUpdateDto(
        string EventType,
        string? CustomEventType,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate
    );
}