using HR_System.Models;

namespace HR_System.Services
{
    public interface IManagerAssignmentUsageResolver
    {
        Task<ManagerAssignmentUsageResult> ResolveUsageByManagerEmployeeAsync(Employee managerEmployee);
    }

    public record ManagerAssignmentUsageResult(
        int AssignedEmployeesCount,
        bool HasReferences,
        bool IsAmbiguousManagerIdentity,
        int MatchingActiveManagersCount
    );
}
