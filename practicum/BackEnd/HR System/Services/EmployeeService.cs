using AutoMapper;
using HR_System.DTOs.Employees;
using HR_System.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HR_System.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IMongoCollection<SystemModel> _systemsCollection;
        private readonly IMapper _mapper;

        public EmployeeService(IMongoDatabase database, IMapper mapper)
        {
            _employeesCollection = database.GetCollection<Employee>("employees");
            _systemsCollection = database.GetCollection<SystemModel>("systems");
            _mapper = mapper;
        }

        public async Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null)
        {
            var employees = await _employeesCollection.Find(_ => true).ToListAsync();
            var filtered = employees.AsEnumerable();

            if (year.HasValue) filtered = filtered.Where(e => e.Year == year.Value);
            if (!string.IsNullOrWhiteSpace(managerName)) filtered = filtered.Where(e => string.Equals(e.ManagerName, managerName, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(professionalCategory)) filtered = filtered.Where(e => string.Equals(e.ProfessionalCategory, professionalCategory, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(systemId)) filtered = filtered.Where(e => (e.Allocations ?? new List<EmployeeAllocation>()).Any(a => string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase)));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                filtered = filtered.Where(e => (!string.IsNullOrWhiteSpace(e.FullName) && e.FullName.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                               (!string.IsNullOrWhiteSpace(e.ManagerName) && e.ManagerName.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                               (!string.IsNullOrWhiteSpace(e.ProfessionalCategory) && e.ProfessionalCategory.Contains(s, StringComparison.OrdinalIgnoreCase)) ||
                               (!string.IsNullOrWhiteSpace(e.ProfessionalSubCategory) && e.ProfessionalSubCategory.Contains(s, StringComparison.OrdinalIgnoreCase)));
            }

            // 💡 שורת המחץ: המרה ישירה, נקייה וגאונית דרך AutoMapper!
            return _mapper.Map<List<EmployeeListItemDto>>(filtered.OrderBy(e => e.FullName).ToList());
        }

        public async Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id)
        {
            var employee = await _employeesCollection.Find(e => e.Id == id).FirstOrDefaultAsync();
            if (employee is null) return null;

            // 💡 שליפה ומיפוי בסיסי חכם מתוך ה-Profile של ה-AutoMapper
            var dto = _mapper.Map<EmployeeDetailsDto>(employee);

            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var systemsById = systems.Where(s => !string.IsNullOrWhiteSpace(s.Id)).ToDictionary(s => s.Id!, s => s, StringComparer.OrdinalIgnoreCase);
            var allEmployees = await _employeesCollection.Find(_ => true).ToListAsync();

            var allocations = (employee.Allocations ?? new List<EmployeeAllocation>()).Select(a =>
            {
                systemsById.TryGetValue(a.SystemId, out var system);
                return new EmployeeAllocationDto(a.SystemId, system?.Name ?? "Unknown", system is null ? "Unknown" : GetSystemCapacityStatus(system, allEmployees), a.RoleInSystem, a.PlannedMonths, a.ActualMonths);
            }).ToList();

            return dto with { Allocations = allocations };
        }

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

        public async Task<string> CreateEmployeeAsync(EmployeeCreateDto dto)
        {
            if (dto is null) throw new ArgumentNullException(nameof(dto));

            var employee = _mapper.Map<Employee>(dto);
            await _employeesCollection.InsertOneAsync(employee);
            return employee.Id ?? string.Empty;
        }

        public async Task<bool> UpdateEmployeeAsync(string id, EmployeeEditDto dto)
        {
            if (dto is null) return false;

            var updateBuilder = Builders<Employee>.Update;
            var updates = new List<UpdateDefinition<Employee>>();

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

        public async Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto)
        {
            if (dto is null) return false;

            var allocation = _mapper.Map<EmployeeAllocation>(dto);
            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == employeeId, Builders<Employee>.Update.Push(e => e.Allocations, allocation));
            return res.ModifiedCount > 0;
        }

        public async Task<bool> DeleteEmployeeAsync(string id)
        {
            var res = await _employeesCollection.UpdateOneAsync(e => e.Id == id, Builders<Employee>.Update.Set(e => e.IsActive, false));
            return res.ModifiedCount > 0;
        }

        // =========================================================================
        // פונקציית עזר סטטית יחידה שנשארה עבור חישוב המערכות מול ה-DB
        // =========================================================================
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