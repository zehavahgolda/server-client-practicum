namespace HR_System.DTOs.Employees
{
    public record EmployeeEventBatchItemDto(
        string EmployeeId,
        List<EmployeeEventDto> Events
    );
}