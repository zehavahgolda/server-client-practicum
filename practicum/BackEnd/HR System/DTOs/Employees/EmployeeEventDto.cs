namespace HR_System.DTOs.Employees
{
    public record EmployeeEventDto(
        string Id,
        string EmployeeId,
        string EventType,
        string? Description,
        DateOnly StartDate,
        DateOnly? EndDate,
        DateTime CreatedAt,
        DateTime? UpdatedAt
    );
}