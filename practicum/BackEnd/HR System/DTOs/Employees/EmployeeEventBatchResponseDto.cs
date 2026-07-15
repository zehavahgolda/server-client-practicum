namespace HR_System.DTOs.Employees
{
    public record EmployeeEventBatchResponseDto(
        List<EmployeeEventBatchItemDto> Items
    );
}