using HR_System.DTOs.Systems;
using HR_System.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<SystemService> _logger;

        public SystemService(
            IMongoDatabase database,
            IConfiguration configuration,
            ILogger<SystemService> logger)
        {
            // אתחול אוספי הנתונים ממסד הנתונים והגדרות המערכת
            _systemsCollection = database.GetCollection<SystemModel>("systems");
            _employeesCollection = database.GetCollection<Employee>("employees");
            _configuration = configuration;
            _logger = logger;
        }

        /// שליפת רשימת מערכות עם סינון (שנה, סטטוס, מנהל או חיפוש חופשי).
        public async Task<List<SystemListItemDto>> GetSystemsAsync(
            int? year = null,
            string? status = null,
            string? ownerManagerName = null,
            string? search = null)
        {
            _logger.LogInformation(
                "Searching systems. Year: {Year}, Status: {Status}, HasOwnerManagerFilter: {HasOwnerManagerFilter}, HasSearchTerm: {HasSearchTerm}",
                year,
                status,
                !string.IsNullOrWhiteSpace(ownerManagerName),
                !string.IsNullOrWhiteSpace(search));

            try
            {
                var systems = await _systemsCollection.Find(_ => true).ToListAsync();
                var employees = await _employeesCollection.Find(_ => true).ToListAsync();
                var filtered = systems.AsEnumerable();

                // סינון לפי שנה ומנהל
                if (year.HasValue)
                    filtered = filtered.Where(s => s.Year == year.Value);

                if (!string.IsNullOrWhiteSpace(ownerManagerName))
                {
                    filtered = filtered.Where(s =>
                        string.Equals(
                            s.OwnerManagerName,
                            ownerManagerName,
                            StringComparison.OrdinalIgnoreCase));
                }

                // חיפוש טקסט חופשי בשם המערכת, שם המנהל או הערות הניהול
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchTerm = search.Trim();

                    filtered = filtered.Where(s =>
                        (!string.IsNullOrWhiteSpace(s.Name) &&
                         s.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrWhiteSpace(s.OwnerManagerName) &&
                         s.OwnerManagerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrWhiteSpace(s.ManagementNote) &&
                         s.ManagementNote.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
                }

                var list = filtered
                    .Select(s => MapToListItemDto(s, employees))
                    .ToList();

                // סינון סופי לפי סטטוס קיבולת (Shortage/Balanced/Excess)
                if (!string.IsNullOrWhiteSpace(status))
                {
                    list = list
                        .Where(s => string.Equals(
                            s.CapacityStatus,
                            status,
                            StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                var result = list
                    .OrderBy(s => s.Name)
                    .ToList();

                _logger.LogInformation(
                    "System search completed. Returned {SystemCount} systems.",
                    result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "System search failed. Year: {Year}, Status: {Status}",
                    year,
                    status);

                throw;
            }
        }

        /// <summary>
        /// שליפת כל המערכות שנמצאות בחוסר כוח אדם (Shortage).
        /// </summary>
        public async Task<List<SystemListItemDto>> GetSystemsWithShortageAsync()
        {
            _logger.LogInformation("Retrieving systems with workforce shortage.");

            try
            {
                var systems = await _systemsCollection.Find(_ => true).ToListAsync();
                var employees = await _employeesCollection.Find(_ => true).ToListAsync();

                var result = systems
                    .Select(s => MapToListItemDto(s, employees))
                    .Where(s => s.CapacityStatus == "Shortage")
                    .OrderBy(s => s.Name)
                    .ToList();

                _logger.LogInformation(
                    "Shortage system retrieval completed. Returned {SystemCount} systems.",
                    result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Shortage system retrieval failed.");

                throw;
            }
        }

        /// שליפת פרטים מלאים על מערכת אחת, כולל עובדים משויכים וניתוח תקציבי/סטייה.
        public async Task<SystemDetailsDto?> GetSystemByIdAsync(string id)
        {
            _logger.LogInformation(
                "Retrieving system details. SystemId: {SystemId}",
                id);

            try
            {
                var system = await _systemsCollection
                    .Find(s => s.Id == id)
                    .FirstOrDefaultAsync();

                if (system is null)
                {
                    _logger.LogWarning(
                        "System details were not found. SystemId: {SystemId}",
                        id);

                    return null;
                }

                var employees = await _employeesCollection.Find(_ => true).ToListAsync();

                var allocations = employees.SelectMany(e =>
                    (e.Allocations ?? [])
                    .Where(a => string.Equals(
                        a.SystemId,
                        id,
                        StringComparison.OrdinalIgnoreCase)));

                var assignedEmployees = employees
                    .SelectMany(e =>
                        (e.Allocations ?? [])
                        .Where(a => string.Equals(
                            a.SystemId,
                            id,
                            StringComparison.OrdinalIgnoreCase))
                        .Select(a => new { Employee = e, Allocation = a }))
                    .Select(x => new SystemAssignedEmployeeDto(
                        x.Employee.Id ?? string.Empty,
                        x.Employee.FullName,
                        x.Employee.ProfessionalCategory,
                        x.Employee.ProfessionalSubCategory,
                        x.Employee.ManagerName,
                        x.Allocation.RoleInSystem,
                        x.Allocation.PlannedMonths,
                        x.Allocation.ActualMonths,
                        GetEmployeeAvailabilityStatus(x.Employee)))
                    .OrderBy(x => x.FullName)
                    .ToList();

                var allocatedMonths = GetAllocatedMonthsBySystemId(employees, id);
                var gap = system.RequiredCapacityMonths - allocatedMonths;

                var costPerManMonth =
                    _configuration.GetValue<decimal>("BudgetSettings:CostPerManMonth");

                var allocatedBudget = system.AllocatedBudget;
                var usedBudget = (decimal)allocatedMonths * costPerManMonth;
                var budgetGap = allocatedBudget - usedBudget;

                double totalPlanned = allocations.Sum(a => a.PlannedMonths);
                double totalActual = allocatedMonths;
                double variancePercent = 0;

                if (totalPlanned > 0)
                {
                    variancePercent =
                        ((double)(totalActual - totalPlanned) / totalPlanned) * 100;
                }

                var result = new SystemDetailsDto(
                    system.Id ?? string.Empty,
                    system.Name,
                    system.RequiredCapacityMonths,
                    allocatedMonths,
                    gap,
                    GetCapacityStatus(gap),
                    GetAssignedEmployeesCount(employees, id),
                    system.ManagementNote,
                    system.UpdatedAt?.ToString("yyyy-MM-dd"),
                    assignedEmployees,
                    [],
                    allocatedBudget,
                    usedBudget,
                    budgetGap,
                    totalPlanned,
                    totalActual,
                    Math.Round(variancePercent, 2)
                );

                _logger.LogInformation(
                    "System details retrieval completed. SystemId: {SystemId}, AssignedEmployeeCount: {AssignedEmployeeCount}, CapacityStatus: {CapacityStatus}",
                    id,
                    assignedEmployees.Count,
                    result.CapacityStatus);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "System details retrieval failed. SystemId: {SystemId}",
                    id);

                throw;
            }
        }

        public async Task<byte[]> ExportSystemsToExcelAsync(
            int? year = null,
            string? status = null)
        {
            _logger.LogInformation(
                "Generating systems Excel export. Year: {Year}, Status: {Status}",
                year,
                status);

            try
            {
                var systems = await GetSystemsAsync(year, status);
                var employees = await _employeesCollection.Find(_ => true).ToListAsync();

                using var workbook = new XLWorkbook();

                // =========================
                // Sheet 1: Systems Summary
                // =========================
                var systemsSheet = workbook.Worksheets.Add("Systems Summary");

                systemsSheet.Cell(1, 1).Value = "System Name";
                systemsSheet.Cell(1, 2).Value = "Required Capacity";
                systemsSheet.Cell(1, 3).Value = "Allocated";
                systemsSheet.Cell(1, 4).Value = "Planned";
                systemsSheet.Cell(1, 5).Value = "Actual";
                systemsSheet.Cell(1, 6).Value = "Variance %";
                systemsSheet.Cell(1, 7).Value = "Status";
                systemsSheet.Cell(1, 8).Value = "Allocated Budget";
                systemsSheet.Cell(1, 9).Value = "Used Budget";
                systemsSheet.Cell(1, 10).Value = "Budget Gap";

                int systemRow = 2;

                foreach (var system in systems)
                {
                    var systemId = system.Id;

                    var systemAllocations = employees
                        .SelectMany(e => e.Allocations ?? [])
                        .Where(a => string.Equals(
                            a.SystemId,
                            systemId,
                            StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    var totalPlanned =
                        systemAllocations.Sum(a => a.PlannedMonths);

                    var totalActual = system.AllocatedMonths;

                    double variance = totalPlanned > 0
                        ? ((double)(totalActual - totalPlanned) / totalPlanned) * 100
                        : 0;

                    systemsSheet.Cell(systemRow, 1).Value = system.Name;
                    systemsSheet.Cell(systemRow, 2).Value = system.RequiredCapacityMonths;
                    systemsSheet.Cell(systemRow, 3).Value = system.AllocatedMonths;
                    systemsSheet.Cell(systemRow, 4).Value = totalPlanned;
                    systemsSheet.Cell(systemRow, 5).Value = totalActual;
                    systemsSheet.Cell(systemRow, 6).Value = Math.Round(variance, 2);
                    systemsSheet.Cell(systemRow, 7).Value = system.CapacityStatus;
                    systemsSheet.Cell(systemRow, 8).Value = system.AllocatedBudget;
                    systemsSheet.Cell(systemRow, 9).Value = system.UsedBudget;
                    systemsSheet.Cell(systemRow, 10).Value = system.BudgetGap;

                    systemRow++;
                }

                systemsSheet.Cell(systemRow, 1).Value = "TOTAL";
                systemsSheet.Cell(systemRow, 2).FormulaA1 = $"SUM(B2:B{systemRow - 1})";
                systemsSheet.Cell(systemRow, 3).FormulaA1 = $"SUM(C2:C{systemRow - 1})";
                systemsSheet.Cell(systemRow, 4).FormulaA1 = $"SUM(D2:D{systemRow - 1})";
                systemsSheet.Cell(systemRow, 5).FormulaA1 = $"SUM(E2:E{systemRow - 1})";
                systemsSheet.Cell(systemRow, 8).FormulaA1 = $"SUM(H2:H{systemRow - 1})";
                systemsSheet.Cell(systemRow, 9).FormulaA1 = $"SUM(I2:I{systemRow - 1})";
                systemsSheet.Cell(systemRow, 10).FormulaA1 = $"SUM(J2:J{systemRow - 1})";

                systemsSheet.Range(1, 1, 1, 10).Style.Font.Bold = true;
                systemsSheet.Range(1, 1, 1, 10).Style.Fill.BackgroundColor = XLColor.LightGray;
                systemsSheet.Range(systemRow, 1, systemRow, 10).Style.Font.Bold = true;
                systemsSheet.Range(systemRow, 1, systemRow, 10).Style.Fill.BackgroundColor = XLColor.LightYellow;
                systemsSheet.Column(6).Style.NumberFormat.Format = "0.00";
                systemsSheet.Columns(8, 10).Style.NumberFormat.Format = "#,##0";
                systemsSheet.Columns().AdjustToContents();

                // =========================
                // Sheet 2: Employees Summary
                // =========================
                var employeesSheet = workbook.Worksheets.Add("Employees Summary");

                employeesSheet.Cell(1, 1).Value = "Employee Name";
                employeesSheet.Cell(1, 2).Value = "Manager";
                employeesSheet.Cell(1, 3).Value = "Category";
                employeesSheet.Cell(1, 4).Value = "Sub Category";
                employeesSheet.Cell(1, 5).Value = "Yearly Capacity";
                employeesSheet.Cell(1, 6).Value = "Planned Months";
                employeesSheet.Cell(1, 7).Value = "Actual Months";
                employeesSheet.Cell(1, 8).Value = "Remaining Months";
                employeesSheet.Cell(1, 9).Value = "Assigned Systems";
                employeesSheet.Cell(1, 10).Value = "Status";

                int employeeRow = 2;

                foreach (var employee in employees.OrderBy(e => e.FullName))
                {
                    var allocations = employee.Allocations ?? [];

                    var plannedMonths = allocations.Sum(a => a.PlannedMonths);
                    var actualMonths = allocations.Sum(a => a.ActualMonths);
                    var remainingMonths =
                        employee.YearlyCapacityMonths - actualMonths;

                    var assignedSystemsCount = allocations
                        .Select(a => a.SystemId)
                        .Where(id => !string.IsNullOrWhiteSpace(id))
                        .Distinct()
                        .Count();

                    var employeeStatus =
                        remainingMonths < 0 ? "Overloaded" :
                        remainingMonths == 0 ? "Full" :
                        "Available";

                    employeesSheet.Cell(employeeRow, 1).Value = employee.FullName;
                    employeesSheet.Cell(employeeRow, 2).Value = employee.ManagerName;
                    employeesSheet.Cell(employeeRow, 3).Value = employee.ProfessionalCategory;
                    employeesSheet.Cell(employeeRow, 4).Value = employee.ProfessionalSubCategory;
                    employeesSheet.Cell(employeeRow, 5).Value = employee.YearlyCapacityMonths;
                    employeesSheet.Cell(employeeRow, 6).Value = plannedMonths;
                    employeesSheet.Cell(employeeRow, 7).Value = actualMonths;
                    employeesSheet.Cell(employeeRow, 8).Value = remainingMonths;
                    employeesSheet.Cell(employeeRow, 9).Value = assignedSystemsCount;
                    employeesSheet.Cell(employeeRow, 10).Value = employeeStatus;

                    employeeRow++;
                }

                employeesSheet.Cell(employeeRow, 1).Value = "TOTAL";
                employeesSheet.Cell(employeeRow, 5).FormulaA1 = $"SUM(E2:E{employeeRow - 1})";
                employeesSheet.Cell(employeeRow, 6).FormulaA1 = $"SUM(F2:F{employeeRow - 1})";
                employeesSheet.Cell(employeeRow, 7).FormulaA1 = $"SUM(G2:G{employeeRow - 1})";
                employeesSheet.Cell(employeeRow, 8).FormulaA1 = $"SUM(H2:H{employeeRow - 1})";

                employeesSheet.Range(1, 1, 1, 10).Style.Font.Bold = true;
                employeesSheet.Range(1, 1, 1, 10).Style.Fill.BackgroundColor = XLColor.LightGray;
                employeesSheet.Range(employeeRow, 1, employeeRow, 10).Style.Font.Bold = true;
                employeesSheet.Range(employeeRow, 1, employeeRow, 10).Style.Fill.BackgroundColor = XLColor.LightYellow;
                employeesSheet.Columns().AdjustToContents();

                using var stream = new MemoryStream();

                // =========================
                // Sheet 3: Allocations Matrix
                // =========================
                var matrixSheet = workbook.Worksheets.Add("Allocations Matrix");

                var orderedSystems = systems
                    .OrderBy(s => s.Name)
                    .ToList();

                var orderedEmployees = employees
                    .OrderBy(e => e.FullName)
                    .ToList();

                matrixSheet.Cell(1, 1).Value = "Employee";

                for (int i = 0; i < orderedSystems.Count; i++)
                {
                    matrixSheet.Cell(1, i + 2).Value = orderedSystems[i].Name;
                }

                int totalColumn = orderedSystems.Count + 2;
                matrixSheet.Cell(1, totalColumn).Value = "TOTAL";

                int matrixRow = 2;

                foreach (var employee in orderedEmployees)
                {
                    matrixSheet.Cell(matrixRow, 1).Value = employee.FullName;

                    double employeeTotal = 0;

                    for (int i = 0; i < orderedSystems.Count; i++)
                    {
                        var system = orderedSystems[i];

                        var actualMonths = (employee.Allocations ?? [])
                            .Where(a => string.Equals(
                                a.SystemId,
                                system.Id,
                                StringComparison.OrdinalIgnoreCase))
                            .Sum(a => a.ActualMonths);

                        if (actualMonths > 0)
                        {
                            matrixSheet.Cell(matrixRow, i + 2).Value = actualMonths;
                        }
                        else
                        {
                            matrixSheet.Cell(matrixRow, i + 2).Value = "";
                        }

                        employeeTotal += actualMonths;
                    }

                    matrixSheet.Cell(matrixRow, totalColumn).Value = employeeTotal;
                    matrixRow++;
                }

                int totalRow = matrixRow;
                matrixSheet.Cell(totalRow, 1).Value = "TOTAL";

                for (int col = 2; col <= totalColumn; col++)
                {
                    matrixSheet.Cell(totalRow, col).FormulaA1 =
                        $"SUM({matrixSheet.Cell(2, col).Address}:{matrixSheet.Cell(totalRow - 1, col).Address})";
                }

                matrixSheet.Range(1, 1, 1, totalColumn).Style.Font.Bold = true;
                matrixSheet.Range(1, 1, 1, totalColumn).Style.Fill.BackgroundColor = XLColor.LightGray;

                matrixSheet.Range(totalRow, 1, totalRow, totalColumn).Style.Font.Bold = true;
                matrixSheet.Range(totalRow, 1, totalRow, totalColumn).Style.Fill.BackgroundColor = XLColor.LightYellow;

                int budgetAllocatedRow = totalRow + 1;
                int budgetUsedRow = totalRow + 2;
                int budgetGapRow = totalRow + 3;

                matrixSheet.Cell(budgetAllocatedRow, 1).Value = "ALLOCATED BUDGET";
                matrixSheet.Cell(budgetUsedRow, 1).Value = "USED BUDGET";
                matrixSheet.Cell(budgetGapRow, 1).Value = "BUDGET GAP";

                for (int i = 0; i < orderedSystems.Count; i++)
                {
                    var system = orderedSystems[i];
                    int col = i + 2;

                    matrixSheet.Cell(budgetAllocatedRow, col).Value = system.AllocatedBudget;
                    matrixSheet.Cell(budgetUsedRow, col).Value = system.UsedBudget;
                    matrixSheet.Cell(budgetGapRow, col).Value = system.BudgetGap;
                }

                matrixSheet.Cell(budgetAllocatedRow, totalColumn).FormulaA1 =
                    $"SUM({matrixSheet.Cell(budgetAllocatedRow, 2).Address}:{matrixSheet.Cell(budgetAllocatedRow, totalColumn - 1).Address})";

                matrixSheet.Cell(budgetUsedRow, totalColumn).FormulaA1 =
                    $"SUM({matrixSheet.Cell(budgetUsedRow, 2).Address}:{matrixSheet.Cell(budgetUsedRow, totalColumn - 1).Address})";

                matrixSheet.Cell(budgetGapRow, totalColumn).FormulaA1 =
                    $"SUM({matrixSheet.Cell(budgetGapRow, 2).Address}:{matrixSheet.Cell(budgetGapRow, totalColumn - 1).Address})";

                matrixSheet.Range(
                        budgetAllocatedRow,
                        1,
                        budgetGapRow,
                        totalColumn)
                    .Style.Font.Bold = true;

                matrixSheet.Range(
                        budgetAllocatedRow,
                        1,
                        budgetGapRow,
                        totalColumn)
                    .Style.Fill.BackgroundColor = XLColor.FromHtml("#EAF4FF");

                matrixSheet.Range(
                        budgetAllocatedRow,
                        2,
                        budgetGapRow,
                        totalColumn)
                    .Style.NumberFormat.Format = "#,##0";

                matrixSheet.Column(1).Style.Font.Bold = true;
                matrixSheet.SheetView.FreezeRows(1);
                matrixSheet.SheetView.FreezeColumns(1);
                matrixSheet.Columns().AdjustToContents();

                workbook.SaveAs(stream);

                var result = stream.ToArray();

                _logger.LogInformation(
                    "Systems Excel export generated successfully. SystemCount: {SystemCount}, EmployeeCount: {EmployeeCount}, FileSizeBytes: {FileSizeBytes}",
                    systems.Count,
                    employees.Count,
                    result.Length);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Systems Excel export generation failed. Year: {Year}, Status: {Status}",
                    year,
                    status);

                throw;
            }
        }

        // פונקציות עזר פנימיות

        // מיפוי מודל מערכת ל-DTO
        private SystemListItemDto MapToListItemDto(
            SystemModel system,
            IEnumerable<Employee> employees)
        {
            var systemId = system.Id ?? string.Empty;
            var allocatedMonths =
                GetAllocatedMonthsBySystemId(employees, systemId);

            var gap = system.RequiredCapacityMonths - allocatedMonths;

            var costPerManMonth =
                _configuration.GetValue<decimal>("BudgetSettings:CostPerManMonth");

            var allocatedBudget = system.AllocatedBudget;
            var usedBudget = (decimal)allocatedMonths * costPerManMonth;
            var budgetGap = allocatedBudget - usedBudget;

            return new SystemListItemDto(
                systemId,
                system.Name,
                system.Year,
                system.RequiredCapacityMonths,
                allocatedMonths,
                gap,
                GetCapacityStatus(gap),
                GetAssignedEmployeesCount(employees, systemId),
                system.ManagementNote,
                allocatedBudget,
                usedBudget,
                budgetGap
            );
        }

        // סכימת חודשי עבודה בפועל עבור מערכת ספציפית
        private static double GetAllocatedMonthsBySystemId(
            IEnumerable<Employee> employees,
            string systemId) =>
            employees
                .SelectMany(e => e.Allocations ?? [])
                .Where(a => string.Equals(
                    a.SystemId,
                    systemId,
                    StringComparison.OrdinalIgnoreCase))
                .Sum(a => a.ActualMonths);

        // ספירת כמות העובדים המוקצים למערכת
        private static int GetAssignedEmployeesCount(
            IEnumerable<Employee> employees,
            string systemId) =>
            employees
                .Where(e => (e.Allocations ?? [])
                .Any(a => string.Equals(
                    a.SystemId,
                    systemId,
                    StringComparison.OrdinalIgnoreCase)))
                .Count();

        // קביעת סטטוס קיבולת המערכת
        private static string GetCapacityStatus(double gap) =>
            gap > 0
                ? "Shortage"
                : (gap == 0 ? "Balanced" : "Excess");

        // קביעת סטטוס זמינות של עובד
        private static string GetEmployeeAvailabilityStatus(Employee employee)
        {
            var remaining =
                employee.YearlyCapacityMonths -
                (employee.Allocations ?? []).Sum(a => a.ActualMonths);

            return remaining > 0
                ? "Available"
                : (remaining == 0 ? "Balanced" : "Overloaded");
        }

        public async Task CreateSystemAsync(SystemCreateDto dto)
        {
            _logger.LogInformation("Creating system.");

            try
            {
                if (dto is null)
                {
                    _logger.LogWarning(
                        "System creation rejected because request data was missing.");

                    throw new ArgumentNullException(nameof(dto));
                }

                var newSystem = new SystemModel
                {
                    Name = dto.Name,
                    OwnerManagerName = dto.OwnerManagerName,
                    Year = dto.Year,
                    RequiredCapacityMonths = dto.RequiredCapacityMonths,
                    ManagementNote = dto.ManagementNote,
                    IsActive = dto.IsActive,
                    UpdatedAt = DateTime.UtcNow
                };

                await _systemsCollection.InsertOneAsync(newSystem);

                _logger.LogInformation(
                    "System created successfully. SystemId: {SystemId}",
                    newSystem.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "System creation failed.");

                throw;
            }
        }

        /// עדכון מערכת קיימת במסד הנתונים.
        public async Task UpdateSystemAsync(string id, SystemCreateDto dto)
        {
            _logger.LogInformation(
                "Updating system. SystemId: {SystemId}",
                id);

            try
            {
                if (dto is null)
                {
                    _logger.LogWarning(
                        "System update rejected because request data was missing. SystemId: {SystemId}",
                        id);

                    throw new ArgumentNullException(nameof(dto));
                }

                var update = Builders<SystemModel>.Update
                    .Set(s => s.Name, dto.Name)
                    .Set(s => s.OwnerManagerName, dto.OwnerManagerName)
                    .Set(s => s.Year, dto.Year)
                    .Set(s => s.RequiredCapacityMonths, dto.RequiredCapacityMonths)
                    .Set(s => s.ManagementNote, dto.ManagementNote)
                    .Set(s => s.IsActive, dto.IsActive)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);

                var result = await _systemsCollection.UpdateOneAsync(
                    s => s.Id == id,
                    update);

                if (result.ModifiedCount > 0)
                {
                    _logger.LogInformation(
                        "System updated successfully. SystemId: {SystemId}",
                        id);
                }
                else
                {
                    _logger.LogWarning(
                        "System update made no changes or system was not found. SystemId: {SystemId}",
                        id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "System update failed. SystemId: {SystemId}",
                    id);

                throw;
            }
        }

        /// הסרת רשומת מערכת ממסד הנתונים.
        public async Task DeleteSystemAsync(string id)
        {
            _logger.LogInformation(
                "Deleting system. SystemId: {SystemId}",
                id);

            try
            {
                var result = await _systemsCollection.DeleteOneAsync(
                    s => s.Id == id);

                if (result.DeletedCount > 0)
                {
                    _logger.LogInformation(
                        "System deleted successfully. SystemId: {SystemId}",
                        id);
                }
                else
                {
                    _logger.LogWarning(
                        "System deletion made no changes because system was not found. SystemId: {SystemId}",
                        id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "System deletion failed. SystemId: {SystemId}",
                    id);

                throw;
            }
        }
    }
}