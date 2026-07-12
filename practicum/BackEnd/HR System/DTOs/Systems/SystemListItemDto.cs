namespace HR_System.DTOs.Systems
{
    public record SystemListItemDto(
        string Id,
        string Name,
        int Year,
        double RequiredCapacityMonths,
        double AllocatedMonths,
        double Gap,
        string CapacityStatus,
        int AssignedEmployeesCount,
        string? ManagementNote,
        decimal AllocatedBudget,
        decimal UsedBudget,
        decimal BudgetGap
    );
}