using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    // Temporary legacy compatibility resolver.
    // Current linkage relies on Employee.ManagerName <-> Employee.FullName exact match (trimmed, case-insensitive).
    // FullName and ManagerName are not stable identifiers and duplicate names can be ambiguous.
    // This resolver is intended to be replaced by ManagerEmployeeId-based relations in a future phase.
    public class LegacyManagerNameUsageResolver : IManagerAssignmentUsageResolver
    {
        private readonly IMongoCollection<Employee> _employeesCollection;

        public LegacyManagerNameUsageResolver(IMongoDatabase database)
        {
            _employeesCollection = database.GetCollection<Employee>("employees");
        }

        public async Task<ManagerAssignmentUsageResult> ResolveUsageByManagerEmployeeAsync(Employee managerEmployee)
        {
            var normalizedManagerName = managerEmployee.FullName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(normalizedManagerName))
            {
                return new ManagerAssignmentUsageResult(0, false, false, 0);
            }

            var activeEmployees = await _employeesCollection
                .Find(employee => employee.IsActive)
                .ToListAsync();

            var matchingActiveManagersCount = activeEmployees.Count(employee =>
                string.Equals(
                    employee.FullName?.Trim(),
                    normalizedManagerName,
                    StringComparison.OrdinalIgnoreCase));

            var assignedEmployeesCount = activeEmployees.Count(employee =>
                string.Equals(
                    employee.ManagerName?.Trim(),
                    normalizedManagerName,
                    StringComparison.OrdinalIgnoreCase));

            var isAmbiguous = matchingActiveManagersCount > 1;

            return new ManagerAssignmentUsageResult(
                assignedEmployeesCount,
                assignedEmployeesCount > 0,
                isAmbiguous,
                matchingActiveManagersCount
            );
        }
    }
}
