namespace HR_System.DTOs.Employees
{
    public record EmployeeEventUpdateDto(
        string EventType,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate
    );
}