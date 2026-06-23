using HR_System.DTOs.Employees;
using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    /// <summary>
    /// שירות לניהול עובדים והקצאותיהם.
    /// אחראי על שליפה, יצירה, עדכון וחישוב סטטוסי קיבולת של עובדים במערכות השונות.
    /// </summary>
    public class EmployeeService : IEmployeeService
    {
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IMongoCollection<SystemModel> _systemsCollection;

        public EmployeeService(IMongoDatabase database)
        {
            // אתחול האוספים של העובדים והמערכות מתוך מסד הנתונים
            _employeesCollection = database.GetCollection<Employee>("employees");
            _systemsCollection = database.GetCollection<SystemModel>("systems");
        }

        /// <summary>
        /// שליפת רשימת עובדים לפי סינונים שונים (שנה, מנהל, קטגוריה, מערכת או חיפוש חופשי)
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

            // החלת סינונים במידה וערכי הפרמטרים קיימים
            if (year.HasValue) filtered = filtered.Where(e => e.Year == year.Value);
            if (!string.IsNullOrWhiteSpace(managerName)) filtered = filtered.Where(e => string.Equals(e.ManagerName, managerName, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(professionalCategory)) filtered = filtered.Where(e => string.Equals(e.ProfessionalCategory, professionalCategory, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(systemId)) filtered = filtered.Where(e => (e.Allocations ?? new List<EmployeeAllocation>()).Any(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase)));

            // ביצוע חיפוש טקסט חופשי בשדות השם, המנהל והקטגוריות
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                filtered = filtered.Where(e => (!string.IsNullOrWhiteSpace(e.FullName) && e.FullName.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                                              (!string.IsNullOrWhiteSpace(e.ManagerName) && e.ManagerName.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                                              (!string.IsNullOrWhiteSpace(e.ProfessionalCategory) && e.ProfessionalCategory.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                                              (!string.IsNullOrWhiteSpace(e.ProfessionalSubCategory) && e.ProfessionalSubCategory.Contains(s, StringComparison.OrdinalIgnoreCase)));
            }

            return filtered.Select(MapToListItemDto).OrderBy(e => e.FullName).ToList();
        }

        /// <summary>
        /// שליפת פרטים מלאים על עובד ספציפי כולל חישוב מצב הקצאותיו במערכות
        /// </summary>
        public async Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id)
        {
            var employee = await _employeesCollection.Find(e => e.Id == id).FirstOrDefaultAsync();
            if (employee is null) return null;

            // שליפת כל המערכות כדי לשייך שמות וסטטוסים להקצאות של העובד
            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var systemsById = systems.Where(s => !string.IsNullOrWhiteSpace(s.Id)).ToDictionary(s => s.Id!, s => s, StringComparer.OrdinalIgnoreCase);
            var allEmployees = await _employeesCollection.Find(_ => true).ToListAsync();

            // מיפוי ההקצאות של העובד לאובייקט DTO עם מידע על הסטטוס העדכני
            var allocations = (employee.Allocations ?? new List<EmployeeAllocation>()).Select(a =>
            {
                systemsById.TryGetValue(a.SystemId, out var system);
                return new EmployeeAllocationDto(a.SystemId, system?.Name ?? "Unknown", system is null ? "Unknown" : GetSystemCapacityStatus(system, allEmployees), a.RoleInSystem, a.PlannedMonths, a.ActualMonths);
            }).ToList();

            return new EmployeeDetailsDto(employee.Id ?? string.Empty, employee.FullName, employee.ProfessionalCategory, employee.ProfessionalSubCategory, employee.ManagerName, employee.Year, employee.YearlyCapacityMonths, GetAllocatedMonths(employee), GetRemainingMonths(employee), GetAvailabilityStatus(employee), GetAssignedSystemsCount(employee), employee.UpcomingEvent, employee.Notes, null, new List<EmployeeRelevantChangeDto>(), allocations);
        }

        /// <summary>
        /// עדכון כמות החודשים בפועל שבוצעו עבור הקצאה מסוימת של עובד למערכת
        /// </summary>
        public async Task<bool> UpdateAllocationActualMonthsAsync(string employeeId, string systemId, string roleInSystem, int actualMonths)
        {
            var employee = await _employeesCollection.Find(e => e.Id == employeeId).FirstOrDefaultAsync();
            if (employee is null) return false;

            var allocations = employee.Allocations ?? new List<EmployeeAllocation>();
            var allocationToUpdate = allocations.FirstOrDefault(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase) && string.Equals(a.RoleInSystem, roleInSystem, StringComparison.OrdinalIgnoreCase));
            if (allocationToUpdate is null) return false;

            allocationToUpdate.ActualMonths = actualMonths;
            var update = Builders<Employee>.Update.Set(e => e.Allocations, allocations);
            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == employeeId, update);
            return res.ModifiedCount > 0;
        }

        /// <summary>
        /// יצירת עובד חדש במסד הנתונים
        /// </summary>
        public async Task<string> CreateEmployeeAsync(EmployeeCreateDto dto)
        {
            if (dto is null) throw new ArgumentNullException(nameof(dto));

            var employee = new Employee
            {
                FullName = dto.FullName,
                ProfessionalCategory = dto.ProfessionalCategory,
                ProfessionalSubCategory = dto.ProfessionalSubCategory,
                ManagerName = dto.ManagerName,
                Year = dto.Year,
                YearlyCapacityMonths = dto.YearlyCapacityMonths,
                UpcomingEvent = dto.UpcomingEvent,
                Notes = dto.Notes,
                IsActive = dto.IsActive,
                Allocations = (dto.Allocations ?? new List<AllocationCreateDto>()).Select(a => new EmployeeAllocation { SystemId = a.SystemId, RoleInSystem = a.RoleInSystem, PlannedMonths = a.PlannedMonths, ActualMonths = a.ActualMonths }).ToList()
            };

            await _employeesCollection.InsertOneAsync(employee);
            return employee.Id ?? string.Empty;
        }

        /// <summary>
        /// עדכון פרטי עובד קיים (שדות שנשלחו ב-DTO בלבד)
        /// </summary>
        public async Task<bool> UpdateEmployeeAsync(string id, EmployeeUpdateDto dto)
        {
            if (dto is null) return false;

            var updateBuilder = Builders<Employee>.Update;
            var updates = new List<UpdateDefinition<Employee>>();

            // הוספת עדכון לכל שדה שאינו null
            if (dto.FullName is not null) updates.Add(updateBuilder.Set(e => e.FullName, dto.FullName));
            if (dto.ProfessionalCategory is not null) updates.Add(updateBuilder.Set(e => e.ProfessionalCategory, dto.ProfessionalCategory));
            if (dto.ProfessionalSubCategory is not null) updates.Add(updateBuilder.Set(e => e.ProfessionalSubCategory, dto.ProfessionalSubCategory));
            if (dto.ManagerName is not null) updates.Add(updateBuilder.Set(e => e.ManagerName, dto.ManagerName));
            if (dto.Year.HasValue) updates.Add(updateBuilder.Set(e => e.Year, dto.Year.Value));
            if (dto.YearlyCapacityMonths.HasValue) updates.Add(updateBuilder.Set(e => e.YearlyCapacityMonths, dto.YearlyCapacityMonths.Value));
            if (dto.UpcomingEvent is not null) updates.Add(updateBuilder.Set(e => e.UpcomingEvent, dto.UpcomingEvent));
            if (dto.Notes is not null) updates.Add(updateBuilder.Set(e => e.Notes, dto.Notes));
            if (dto.IsActive.HasValue) updates.Add(updateBuilder.Set(e => e.IsActive, dto.IsActive.Value));

            if (!updates.Any()) return false;

            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == id, updateBuilder.Combine(updates));
            return res.ModifiedCount > 0;
        }

        /// <summary>
        /// הוספת הקצאה חדשה לרשימת ההקצאות של עובד קיים
        /// </summary>
        public async Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto)
        {
            if (dto is null) return false;

            var allocation = new EmployeeAllocation { SystemId = dto.SystemId, RoleInSystem = dto.RoleInSystem, PlannedMonths = dto.PlannedMonths, ActualMonths = dto.ActualMonths };
            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == employeeId, Builders<Employee>.Update.Push(e => e.Allocations, allocation));
            return res.ModifiedCount > 0;
        }

        /// <summary>
        /// "מחיקה" רכה של עובד (עדכון סטטוס פעילות ל-false במקום מחיקה פיזית)
        /// </summary>
        public async Task<bool> DeleteEmployeeAsync(string id)
        {
            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == id, Builders<Employee>.Update.Set(e => e.IsActive, false));
            return res.ModifiedCount > 0;
        }

        // פונקציות עזר פנימיות לחישוב ומיפוי נתונים:

        // ממפה אובייקט עובד ל-DTO מוצג ברשימה
        private static EmployeeListItemDto MapToListItemDto(Employee employee)
        {
            var allocatedMonths = GetAllocatedMonths(employee);
            return new EmployeeListItemDto(employee.Id ?? string.Empty, employee.FullName, employee.ProfessionalCategory, employee.ProfessionalSubCategory, employee.ManagerName, employee.Year, employee.YearlyCapacityMonths, allocatedMonths, GetRemainingMonths(employee), GetAvailabilityStatus(employee), GetAssignedSystemsCount(employee), employee.UpcomingEvent);
        }

        // מחשב את סך כל החודשים שהוקצו לעובד
        private static int GetAllocatedMonths(Employee employee) => (employee.Allocations ?? new List<EmployeeAllocation>()).Sum(a => a.ActualMonths);

        // מחשב כמה חודשי קיבולת נותרו לעובד (קיבולת שנתית פחות חודשים מוקצים)
        private static int GetRemainingMonths(Employee employee) => employee.YearlyCapacityMonths - GetAllocatedMonths(employee);

        // קובע את הסטטוס הזמינות של העובד (Available/Balanced/Overloaded)
        private static string GetAvailabilityStatus(Employee employee)
        {
            var remaining = GetRemainingMonths(employee);
            return remaining > 0 ? "Available" : (remaining == 0 ? "Balanced" : "Overloaded");
        }

        // מחשב את כמות המערכות הייחודיות שהעובד משויך אליהן
        private static int GetAssignedSystemsCount(Employee employee) => (employee.Allocations ?? new List<EmployeeAllocation>()).Select(a => a.SystemId).Distinct().Count();

        // מחשב את סטטוס העומס של מערכת ספציפית בהשוואה לכלל העובדים שהוקצו אליה
        private static string GetSystemCapacityStatus(SystemModel system, IEnumerable<Employee> allEmployees)
        {
            var allocated = allEmployees.SelectMany(e => e.Allocations ?? new List<EmployeeAllocation>())
                                        .Where(a => string.Equals(a.SystemId, system.Id, StringComparison.OrdinalIgnoreCase))
                                        .Sum(a => a.ActualMonths);
            var gap = system.RequiredCapacityMonths - allocated;
            return gap > 0 ? "Shortage" : (gap == 0 ? "Balanced" : "Excess");
        }
    }
}