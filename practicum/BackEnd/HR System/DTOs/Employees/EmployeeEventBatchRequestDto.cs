namespace HR_System.DTOs.Employees
{
    public record EmployeeEventBatchRequestDto(
        List<string> EmployeeIds
    );
}