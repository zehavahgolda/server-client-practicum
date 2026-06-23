using HR_System.DTOs.Employees;
using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IMongoCollection<SystemModel> _systemsCollection;

        public EmployeeService(IMongoDatabase database)
        {
            _employeesCollection = database.GetCollection<Employee>("employees");
            _systemsCollection = database.GetCollection<SystemModel>("systems");
        }

        /// <summary>
        /// שליפת רשימת עובדים מסוננת עם חישוב שדות וחישוב שדות מחושבטות
        /// </summary>
        public async Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null)
        {
            var employees = await _employeesCollection.Find(_ => true).ToListAsync();

            var filtered = employees.AsEnumerable();

            if (year.HasValue)
            {
                filtered = filtered.Where(e => e.Year == year.Value);
            }

            if (!string.IsNullOrWhiteSpace(managerName))
            {
                filtered = filtered.Where(e =>
                    string.Equals(e.ManagerName, managerName, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(professionalCategory))
            {
                filtered = filtered.Where(e =>
                    string.Equals(e.ProfessionalCategory, professionalCategory, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(systemId))
            {
                filtered = filtered.Where(e =>
                    (e.Allocations ?? []).Any(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim();
                filtered = filtered.Where(e =>
                    (!string.IsNullOrWhiteSpace(e.FullName) && e.FullName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(e.ManagerName) && e.ManagerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(e.ProfessionalCategory) && e.ProfessionalCategory.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(e.ProfessionalSubCategory) && e.ProfessionalSubCategory.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
            }

            return filtered
                .Select(MapToListItemDto)
                .OrderBy(e => e.FullName)
                .ToList();
        }

        /// <summary>
        /// שליפת פרטי עובד כולל הקצאות אל מערכות ץ דטאילים אישיים
        /// </summary>
        public async Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id)
        {
            var employee = await _employeesCollection.Find(e => e.Id == id).FirstOrDefaultAsync();
            if (employee is null)
            {
                return null;
            }

            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var systemsById = systems
                .Where(s => !string.IsNullOrWhiteSpace(s.Id))
                .ToDictionary(s => s.Id!, s => s, StringComparer.OrdinalIgnoreCase);

            var allEmployees = await _employeesCollection.Find(_ => true).ToListAsync();

            var allocations = (employee.Allocations ?? [])
                .Select(a =>
                {
                    systemsById.TryGetValue(a.SystemId, out var system);
                    return new EmployeeAllocationDto(
                        a.SystemId,
                        system?.Name ?? "Unknown",
                        system is null ? "Unknown" : GetSystemCapacityStatus(system, allEmployees),
                        a.RoleInSystem,
                        a.PlannedMonths,
                        a.ActualMonths);
                })
                .ToList();

            return new EmployeeDetailsDto(
                employee.Id ?? string.Empty,
                employee.FullName,
                employee.ProfessionalCategory,
                employee.ProfessionalSubCategory,
                employee.ManagerName,
                employee.Year,
                employee.YearlyCapacityMonths,
                GetAllocatedMonths(employee),
                GetRemainingMonths(employee),
                GetAvailabilityStatus(employee),
                GetAssignedSystemsCount(employee),
                employee.UpcomingEvent,
                employee.Notes,
                null,
                [],
                allocations);
        }

        /// <summary>
        /// עדכון חודשים בפועל שטימה להקצאה מרהרט ספציט במערכת
        /// </summary>
        public async Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths)
        {
            var employee = await _employeesCollection.Find(e => e.Id == employeeId).FirstOrDefaultAsync();
            if (employee is null)
            {
                return false;
            }

            var allocations = employee.Allocations ?? [];
            var allocationToUpdate = allocations.FirstOrDefault(a =>
                string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(a.RoleInSystem, roleInSystem, StringComparison.OrdinalIgnoreCase));

            if (allocationToUpdate is null)
            {
                return false;
            }

            allocationToUpdate.ActualMonths = actualMonths;

            var update = Builders<Employee>.Update.Set(e => e.Allocations, allocations);
            var result = await _employeesCollection.UpdateOneAsync(e => e.Id == employeeId, update);

            return result.ModifiedCount > 0;
        }

        private static EmployeeListItemDto MapToListItemDto(Employee employee)
        {
            var allocatedMonths = GetAllocatedMonths(employee);
            var remainingMonths = employee.YearlyCapacityMonths - allocatedMonths;

            return new EmployeeListItemDto(
                employee.Id ?? string.Empty,
                employee.FullName,
                employee.ProfessionalCategory,
                employee.ProfessionalSubCategory,
                employee.ManagerName,
                employee.Year,
                employee.YearlyCapacityMonths,
                allocatedMonths,
                remainingMonths,
                GetAvailabilityStatus(employee),
                GetAssignedSystemsCount(employee),
                employee.UpcomingEvent);
        }

        private static int GetAllocatedMonths(Employee employee)
        {
            return (employee.Allocations ?? []).Sum(a => a.ActualMonths);
        }

        private static int GetRemainingMonths(Employee employee)
        {
            return employee.YearlyCapacityMonths - GetAllocatedMonths(employee);
        }

        private static string GetAvailabilityStatus(Employee employee)
        {
            var remaining = GetRemainingMonths(employee);

            if (remaining > 0)
            {
                return "Available";
            }

            if (remaining == 0)
            {
                return "Balanced";
            }

            return "Overloaded";
        }

        private static int GetAssignedSystemsCount(Employee employee)
        {
            return (employee.Allocations ?? [])
                .Where(a => !string.IsNullOrWhiteSpace(a.SystemId))
                .Select(a => a.SystemId)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();
        }

        private static int GetSystemAllocatedMonths(IEnumerable<Employee> employees, string systemId)
        {
            return employees
                .SelectMany(e => e.Allocations ?? [])
                .Where(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase))
                .Sum(a => a.ActualMonths);
        }

        private static string GetSystemCapacityStatus(SystemModel system, IEnumerable<Employee> allEmployees)
        {
            var allocated = GetSystemAllocatedMonths(allEmployees, system.Id ?? string.Empty);
            var gap = system.RequiredCapacityMonths - allocated;

            if (gap > 0)
            {
                return "Shortage";
            }

            if (gap == 0)
            {
                return "Balanced";
            }

            return "Excess";
        }
    }
}