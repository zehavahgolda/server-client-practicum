using HR_System.DTOs.Systems;

public record SystemDetailsDto(
    string Id,
    string Name,
    int RequiredCapacityMonths,
    int AllocatedMonths,
    int Gap,
    string CapacityStatus,
    int AssignedEmployeesCount,
    string? ManagementNote,
    string? UpdatedAt,
    List<SystemAssignedEmployeeDto> AssignedEmployees,
    List<object> Changes,
    decimal TotalBudget,
    int TotalPlannedMonths,
    int TotalActualMonths,
    double VariancePercent
);