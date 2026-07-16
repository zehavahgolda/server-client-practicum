using HR_System.DTOs.Systems;
using HR_System.DTOs.OrganizationEvents;

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
    List<OrganizationEventDto> OrganizationEvents,
    List<object> Changes,
    decimal AllocatedBudget,
    decimal UsedBudget,
    decimal BudgetGap,
    double TotalPlannedMonths,
    double TotalActualMonths,
    double VariancePercent
);