using HR_System.DTOs.Systems;

public record SystemDetailsDto(
    string Id,
    string Name,
    double RequiredCapacityMonths,
    double AllocatedMonths,
    double Gap,
    string CapacityStatus,
    int AssignedEmployeesCount,
    string? ManagementNote,
    string? UpdatedAt,
    List<SystemAssignedEmployeeDto> AssignedEmployees,
    List<object> Changes,
    decimal AllocatedBudget,
    decimal UsedBudget,
    decimal BudgetGap,
    double TotalPlannedMonths,
    double TotalActualMonths,
    double VariancePercent
);