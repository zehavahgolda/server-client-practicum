using HR_System.DTOs.Systems;
using HR_System.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using ClosedXML.Excel;
using System.IO;

namespace HR_System.Services
{
    /// <summary>
    /// שירות לניהול מערכות (Systems).
    /// אחראי על שליפת נתונים, חישובי קיבולת, ניתוח סטיות (Variance) וייצוא דוחות לאקסל.
    /// </summary>
    public class SystemService : ISystemService
    {
        private readonly IMongoCollection<SystemModel> _systemsCollection;
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IConfiguration _configuration;

        public SystemService(IMongoDatabase database, IConfiguration configuration)
        {
            // אתחול אוספי הנתונים ממסד הנתונים והגדרות המערכת
            _systemsCollection = database.GetCollection<SystemModel>("systems");
            _employeesCollection = database.GetCollection<Employee>("employees");
            _configuration = configuration;
        }

        /// <summary>
        /// שליפת רשימת מערכות עם סינון (שנה, סטטוס, מנהל או חיפוש חופשי).
        /// </summary>
        public async Task<List<SystemListItemDto>> GetSystemsAsync(
            int? year = null, string? status = null, string? ownerManagerName = null, string? search = null)
        {
            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var employees = await _employeesCollection.Find(_ => true).ToListAsync();
            var filtered = systems.AsEnumerable();

            // סינון לפי שנה ומנהל
            if (year.HasValue) filtered = filtered.Where(s => s.Year == year.Value);
            if (!string.IsNullOrWhiteSpace(ownerManagerName))
                filtered = filtered.Where(s => string.Equals(s.OwnerManagerName, ownerManagerName, StringComparison.OrdinalIgnoreCase));

            // חיפוש טקסט חופשי בשם המערכת, שם המנהל או הערות הניהול
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim();
                filtered = filtered.Where(s =>
                    (!string.IsNullOrWhiteSpace(s.Name) && s.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(s.OwnerManagerName) && s.OwnerManagerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(s.ManagementNote) && s.ManagementNote.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
            }

            var list = filtered.Select(s => MapToListItemDto(s, employees)).ToList();

            // סינון סופי לפי סטטוס קיבולת (Shortage/Balanced/Excess)
            if (!string.IsNullOrWhiteSpace(status))
                list = list.Where(s => string.Equals(s.CapacityStatus, status, StringComparison.OrdinalIgnoreCase)).ToList();

            return list.OrderBy(s => s.Name).ToList();
        }

        /// <summary>
        /// שליפת כל המערכות שנמצאות בחוסר כוח אדם (Shortage).
        /// </summary>
        public async Task<List<SystemListItemDto>> GetSystemsWithShortageAsync()
        {
            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var employees = await _employeesCollection.Find(_ => true).ToListAsync();

            return systems
                .Select(s => MapToListItemDto(s, employees))
                .Where(s => s.CapacityStatus == "Shortage")
                .OrderBy(s => s.Name)
                .ToList();
        }

        /// <summary>
        /// שליפת פרטים מלאים על מערכת אחת, כולל עובדים משויכים וניתוח תקציבי/סטייה.
        /// </summary>
        public async Task<SystemDetailsDto?> GetSystemByIdAsync(string id)
        {
            var system = await _systemsCollection.Find(s => s.Id == id).FirstOrDefaultAsync();
            if (system is null) return null;

            var employees = await _employeesCollection.Find(_ => true).ToListAsync();

            // איסוף כל ההקצאות ששייכות למערכת זו
            var allocations = employees.SelectMany(e => (e.Allocations ?? []).Where(a => string.Equals(a.SystemId, id, StringComparison.OrdinalIgnoreCase)));

            // יצירת רשימת עובדים משויכים עם סטטוס הזמינות שלהם
            var assignedEmployees = employees
                .SelectMany(e => (e.Allocations ?? []).Where(a => string.Equals(a.SystemId, id, StringComparison.OrdinalIgnoreCase))
                .Select(a => new { Employee = e, Allocation = a }))
                .Select(x => new SystemAssignedEmployeeDto(
                    x.Employee.Id ?? string.Empty, x.Employee.FullName, x.Employee.ProfessionalCategory,
                    x.Employee.ProfessionalSubCategory, x.Employee.ManagerName, x.Allocation.RoleInSystem,
                    x.Allocation.PlannedMonths, x.Allocation.ActualMonths, GetEmployeeAvailabilityStatus(x.Employee)))
                .OrderBy(x => x.FullName).ToList();

            // חישובים פיננסיים וסטטיסטיים
            var allocatedMonths = GetAllocatedMonthsBySystemId(employees, id);
            var gap = system.RequiredCapacityMonths - allocatedMonths;
            var costPerManMonth = _configuration.GetValue<decimal>("BudgetSettings:CostPerManMonth");
            var budget = (decimal)allocatedMonths * costPerManMonth;

            // חישוב ניתוח סטיות בין תכנון לביצוע בפועל
            int totalPlanned = allocations.Sum(a => a.PlannedMonths);
            int totalActual = allocatedMonths;
            double variancePercent = 0;
            if (totalPlanned > 0)
            {
                variancePercent = ((double)(totalActual - totalPlanned) / totalPlanned) * 100;
            }

            return new SystemDetailsDto(
                system.Id ?? string.Empty, system.Name, system.RequiredCapacityMonths,
                allocatedMonths, gap, GetCapacityStatus(gap), GetAssignedEmployeesCount(employees, id),
                system.ManagementNote, system.UpdatedAt?.ToString("yyyy-MM-dd"), assignedEmployees, [], budget,
                totalPlanned, totalActual, Math.Round(variancePercent, 2)
            );
        }

        /// <summary>
        /// ייצוא דוח המערכות לקובץ אקסל.
        /// </summary>
        public async Task<byte[]> ExportSystemsToExcelAsync(int? year = null, string? status = null)
        {
            var systems = await GetSystemsAsync(year, status);
            var employees = await _employeesCollection.Find(_ => true).ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("SystemsReport");

                // יצירת כותרות הטבלה
                worksheet.Cell(1, 1).Value = "System Name";
                worksheet.Cell(1, 2).Value = "Required Capacity";
                worksheet.Cell(1, 3).Value = "Allocated";
                worksheet.Cell(1, 4).Value = "Planned";
                worksheet.Cell(1, 5).Value = "Actual";
                worksheet.Cell(1, 6).Value = "Variance %";
                worksheet.Cell(1, 7).Value = "Status";

                // מילוי הנתונים מהמערכות
                int currentRow = 2;
                foreach (var system in systems)
                {
                    var systemId = system.Id;
                    var totalPlanned = employees.SelectMany(e => e.Allocations ?? [])
                                               .Where(a => a.SystemId == systemId)
                                               .Sum(a => a.PlannedMonths);

                    var totalActual = system.AllocatedMonths;
                    double variance = totalPlanned > 0 ? ((double)(totalActual - totalPlanned) / totalPlanned) * 100 : 0;

                    worksheet.Cell(currentRow, 1).Value = system.Name;
                    worksheet.Cell(currentRow, 2).Value = system.RequiredCapacityMonths;
                    worksheet.Cell(currentRow, 3).Value = system.AllocatedMonths;
                    worksheet.Cell(currentRow, 4).Value = totalPlanned;
                    worksheet.Cell(currentRow, 5).Value = totalActual;
                    worksheet.Cell(currentRow, 6).Value = Math.Round(variance, 2);
                    worksheet.Cell(currentRow, 7).Value = system.CapacityStatus;

                    currentRow++;
                }

                // הוספת שורת סיכום עם נוסחאות SUM של אקסל
                worksheet.Cell(currentRow, 1).Value = "TOTAL";
                worksheet.Cell(currentRow, 2).FormulaA1 = $"SUM(B2:B{currentRow - 1})";
                worksheet.Cell(currentRow, 3).FormulaA1 = $"SUM(C2:C{currentRow - 1})";
                worksheet.Cell(currentRow, 4).FormulaA1 = $"SUM(D2:D{currentRow - 1})";
                worksheet.Cell(currentRow, 5).FormulaA1 = $"SUM(E2:E{currentRow - 1})";

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        // פונקציות עזר פנימיות

        // מיפוי מודל מערכת ל-DTO
        private static SystemListItemDto MapToListItemDto(SystemModel system, IEnumerable<Employee> employees)
        {
            var systemId = system.Id ?? string.Empty;
            var allocatedMonths = GetAllocatedMonthsBySystemId(employees, systemId);
            var gap = system.RequiredCapacityMonths - allocatedMonths;
            return new SystemListItemDto(systemId, system.Name, system.Year, system.RequiredCapacityMonths,
                allocatedMonths, gap, GetCapacityStatus(gap), GetAssignedEmployeesCount(employees, systemId), system.ManagementNote);
        }

        // סכימת חודשי עבודה בפועל עבור מערכת ספציפית
        private static int GetAllocatedMonthsBySystemId(IEnumerable<Employee> employees, string systemId) =>
            employees.SelectMany(e => e.Allocations ?? []).Where(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase)).Sum(a => a.ActualMonths);

        // ספירת כמות העובדים המוקצים למערכת
        private static int GetAssignedEmployeesCount(IEnumerable<Employee> employees, string systemId) =>
            employees.Where(e => (e.Allocations ?? []).Any(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase))).Count();

        // קביעת סטטוס קיבולת המערכת
        private static string GetCapacityStatus(int gap) => gap > 0 ? "Shortage" : (gap == 0 ? "Balanced" : "Excess");

        // קביעת סטטוס זמינות של עובד
        private static string GetEmployeeAvailabilityStatus(Employee employee)
        {
            var remaining = employee.YearlyCapacityMonths - (employee.Allocations ?? []).Sum(a => a.ActualMonths);
            return remaining > 0 ? "Available" : (remaining == 0 ? "Balanced" : "Overloaded");
        }
    }
}