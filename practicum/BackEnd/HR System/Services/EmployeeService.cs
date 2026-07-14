using AutoMapper;
using HR_System.DTOs.Employees;
using HR_System.Models;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<EmployeeService> _logger;

        public EmployeeService(
            IMongoDatabase database,
            IMapper mapper,
            ILogger<EmployeeService> logger)
        {
            _employeesCollection = database.GetCollection<Employee>("employees");
            _systemsCollection = database.GetCollection<SystemModel>("systems");
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<EmployeeListItemDto>> GetEmployeesAsync(
     int? year = null,
     string? managerName = null,
     string? professionalCategory = null,
     string? systemId = null,
     string? search = null,
     bool? isActive = null)
        {
            _logger.LogInformation(
                "Searching employees. Year: {Year}, Manager: {ManagerName}, Category: {ProfessionalCategory}, SystemId: {SystemId}, Search: {Search}, IsActive: {IsActive}",
                year,
                managerName,
                professionalCategory,
                systemId,
                search,
                isActive);

            try
            {
                var employees = await _employeesCollection
                    .Find(_ => true)
                    .ToListAsync();

                var filtered = employees.AsEnumerable();

                // true  - רק פעילים.
                // false - רק לא פעילים.
                // null  - כל העובדים.
                if (isActive.HasValue)
                {
                    filtered = filtered.Where(employee =>
                        employee.IsActive == isActive.Value);
                }

                if (year.HasValue)
                {
                    filtered = filtered.Where(employee =>
                        employee.Year == year.Value);
                }

                if (!string.IsNullOrWhiteSpace(managerName))
                {
                    var normalizedManagerName = managerName.Trim();

                    filtered = filtered.Where(employee =>
                        string.Equals(
                            employee.ManagerName,
                            normalizedManagerName,
                            StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(professionalCategory))
                {
                    var normalizedCategory =
                        professionalCategory.Trim();

                    filtered = filtered.Where(employee =>
                        string.Equals(
                            employee.ProfessionalCategory,
                            normalizedCategory,
                            StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(systemId))
                {
                    var normalizedSystemId = systemId.Trim();

                    filtered = filtered.Where(employee =>
                        (employee.Allocations ??
                         new List<EmployeeAllocation>())
                        .Any(allocation =>
                            string.Equals(
                                allocation.SystemId,
                                normalizedSystemId,
                                StringComparison.OrdinalIgnoreCase)));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var normalizedSearch = search.Trim();

                    filtered = filtered.Where(employee =>
                        (!string.IsNullOrWhiteSpace(employee.FullName) &&
                         employee.FullName.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(employee.ManagerName) &&
                         employee.ManagerName.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(
                            employee.ProfessionalCategory) &&
                         employee.ProfessionalCategory.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(
                            employee.ProfessionalSubCategory) &&
                         employee.ProfessionalSubCategory.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)));
                }

                var result = _mapper.Map<List<EmployeeListItemDto>>(
                    filtered
                        .OrderBy(employee => employee.FullName)
                        .ToList());

                _logger.LogInformation(
                    "Employee search completed. IsActive: {IsActive}, Returned {EmployeeCount} employees.",
                    isActive,
                    result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Employee search failed. Year: {Year}, Manager: {ManagerName}, Category: {ProfessionalCategory}, SystemId: {SystemId}, IsActive: {IsActive}",
                    year,
                    managerName,
                    professionalCategory,
                    systemId,
                    isActive);

                throw;
            }
        }
        public async Task<List<EmployeeAssignmentCandidateDto>> GetAssignmentCandidatesAsync(
    string systemId,
    int? year = null,
    string? search = null)
        {
            _logger.LogInformation(
                "Searching assignment candidates. SystemId: {SystemId}, Year: {Year}, Search: {Search}",
                systemId,
                year,
                search);

            try
            {
                var employees = await _employeesCollection
                    .Find(employee => employee.IsActive)
                    .ToListAsync();

                var filtered = employees.AsEnumerable();

                if (year.HasValue)
                {
                    filtered = filtered.Where(employee =>
                        employee.Year == year.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var normalizedSearch = search.Trim();

                    filtered = filtered.Where(employee =>
                        (!string.IsNullOrWhiteSpace(employee.FullName) &&
                         employee.FullName.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(employee.ManagerName) &&
                         employee.ManagerName.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(employee.ProfessionalCategory) &&
                         employee.ProfessionalCategory.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)) ||

                        (!string.IsNullOrWhiteSpace(employee.ProfessionalSubCategory) &&
                         employee.ProfessionalSubCategory.Contains(
                             normalizedSearch,
                             StringComparison.OrdinalIgnoreCase)));
                }

                var result = filtered
                    .OrderBy(employee => employee.FullName)
                    .Select(employee =>
                    {
                        var allocations =
                            employee.Allocations ??
                            new List<EmployeeAllocation>();

                        var allocatedMonths = allocations.Sum(
                            allocation => allocation.ActualMonths);

                        var remainingMonths =
                            employee.YearlyCapacityMonths - allocatedMonths;

                        var currentSystemAllocations = allocations
                            .Where(allocation =>
                                string.Equals(
                                    allocation.SystemId,
                                    systemId,
                                    StringComparison.OrdinalIgnoreCase))
                            .ToList();

                        var alreadyAssignedToSystem =
                            currentSystemAllocations.Count > 0;

                        var currentSystemMonths =
                            currentSystemAllocations.Sum(
                                allocation => allocation.ActualMonths);

                        var allocatedOutsideCurrentSystem =
                            allocatedMonths - currentSystemMonths;

                        var maxAssignableMonths = Math.Max(
                            0,
                            employee.YearlyCapacityMonths -
                            allocatedOutsideCurrentSystem);

                        var canAssign = maxAssignableMonths >= 0.5;

                        return new EmployeeAssignmentCandidateDto(
                            employee.Id ?? string.Empty,
                            employee.FullName,
                            employee.ProfessionalCategory,
                            employee.ProfessionalSubCategory,
                            employee.ManagerName,
                            employee.YearlyCapacityMonths,
                            allocatedMonths,
                            remainingMonths,
                            currentSystemMonths,
                            maxAssignableMonths,
                            GetAvailabilityStatus(employee),
                            GetAssignedSystemsCount(employee),
                            alreadyAssignedToSystem,
                            canAssign
                        );
                    })
                    .ToList();

                _logger.LogInformation(
                    "Assignment candidate search completed. SystemId: {SystemId}, Returned {CandidateCount} candidates.",
                    systemId,
                    result.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Assignment candidate search failed. SystemId: {SystemId}, Year: {Year}",
                    systemId,
                    year);

                throw;
            }
        }
        public async Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id)
        {
            _logger.LogInformation(
                "Retrieving employee details. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var employee = await _employeesCollection.Find(e => e.Id == id).FirstOrDefaultAsync();

                if (employee is null)
                {
                    _logger.LogWarning(
                        "Employee details were not found. EmployeeId: {EmployeeId}",
                        id);

                    return null;
                }

                var dto = _mapper.Map<EmployeeDetailsDto>(employee);

                var systems = await _systemsCollection.Find(_ => true).ToListAsync();
                var systemsById = systems
                    .Where(s => !string.IsNullOrWhiteSpace(s.Id))
                    .ToDictionary(s => s.Id!, s => s, StringComparer.OrdinalIgnoreCase);

                var allEmployees = await _employeesCollection.Find(_ => true).ToListAsync();

                var allocations = (employee.Allocations ?? new List<EmployeeAllocation>())
                    .Select(a =>
                    {
                        systemsById.TryGetValue(a.SystemId, out var system);

                        return new EmployeeAllocationDto(
                            a.SystemId,
                            system?.Name ?? "Unknown",
                            system is null ? "Unknown" : GetSystemCapacityStatus(system, allEmployees),
                            a.RoleInSystem,
                            a.PlannedMonths,
                            a.ActualMonths
                        );
                    })
                    .ToList();

                _logger.LogInformation(
                    "Employee details retrieval completed. EmployeeId: {EmployeeId}, AllocationCount: {AllocationCount}",
                    id,
                    allocations.Count);

                return dto with { Allocations = allocations };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Employee details retrieval failed. EmployeeId: {EmployeeId}",
                    id);

                throw;
            }
        }

        public async Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths)
        {
            _logger.LogInformation(
                "Updating allocation actual months. EmployeeId: {EmployeeId}, SystemId: {SystemId}, Role: {RoleInSystem}, ActualMonths: {ActualMonths}",
                employeeId,
                systemId,
                roleInSystem,
                actualMonths);

            try
            {
                var employee = await _employeesCollection
                    .Find(e => e.Id == employeeId)
                    .FirstOrDefaultAsync();

                if (employee is null)
                {
                    _logger.LogWarning(
                        "Allocation update failed because employee was not found. EmployeeId: {EmployeeId}",
                        employeeId);

                    return false;
                }

                var allocations = employee.Allocations ?? new List<EmployeeAllocation>();

                var allocationToUpdate = allocations.FirstOrDefault(a =>
                    string.Equals(a.SystemId, systemId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(a.RoleInSystem, roleInSystem, StringComparison.OrdinalIgnoreCase));

                if (allocationToUpdate is null)
                {
                    _logger.LogWarning(
                        "Allocation update failed because allocation was not found. EmployeeId: {EmployeeId}, SystemId: {SystemId}, Role: {RoleInSystem}",
                        employeeId,
                        systemId,
                        roleInSystem);

                    return false;
                }

                allocationToUpdate.ActualMonths = actualMonths;

                var update = Builders<Employee>.Update.Set(e => e.Allocations, allocations);
                var result = await _employeesCollection.UpdateOneAsync(
                    e => e.Id == employeeId,
                    update);

                var updated = result.ModifiedCount > 0;

                if (updated)
                {
                    _logger.LogInformation(
                        "Allocation actual months updated successfully. EmployeeId: {EmployeeId}, SystemId: {SystemId}, ActualMonths: {ActualMonths}",
                        employeeId,
                        systemId,
                        actualMonths);
                }
                else
                {
                    _logger.LogWarning(
                        "Allocation actual months were not changed. EmployeeId: {EmployeeId}, SystemId: {SystemId}",
                        employeeId,
                        systemId);
                }

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Allocation actual months update failed. EmployeeId: {EmployeeId}, SystemId: {SystemId}",
                    employeeId,
                    systemId);

                throw;
            }
        }

        public async Task<string> CreateEmployeeAsync(EmployeeCreateDto dto)
        {
            _logger.LogInformation("Creating employee.");

            try
            {
                if (dto is null)
                {
                    _logger.LogWarning("Employee creation rejected because request data was missing.");
                    throw new ArgumentNullException(nameof(dto));
                }

                var employee = _mapper.Map<Employee>(dto);
                await _employeesCollection.InsertOneAsync(employee);

                var employeeId = employee.Id ?? string.Empty;

                _logger.LogInformation(
                    "Employee created successfully. EmployeeId: {EmployeeId}",
                    employeeId);

                return employeeId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Employee creation failed.");
                throw;
            }
        }

        public async Task<bool> UpdateEmployeeAsync(string id, EmployeeEditDto dto)
        {
            _logger.LogInformation(
                "Updating employee. EmployeeId: {EmployeeId}",
                id);

            try
            {
                if (dto is null)
                {
                    _logger.LogWarning(
                        "Employee update rejected because request data was missing. EmployeeId: {EmployeeId}",
                        id);

                    return false;
                }

                var updateBuilder = Builders<Employee>.Update;
                var updates = new List<UpdateDefinition<Employee>>();

                if (dto.FullName is not null)
                    updates.Add(updateBuilder.Set(e => e.FullName, dto.FullName));

                if (dto.ProfessionalCategory is not null)
                    updates.Add(updateBuilder.Set(e => e.ProfessionalCategory, dto.ProfessionalCategory));

                if (dto.ProfessionalSubCategory is not null)
                    updates.Add(updateBuilder.Set(e => e.ProfessionalSubCategory, dto.ProfessionalSubCategory));

                if (dto.ManagerName is not null)
                    updates.Add(updateBuilder.Set(e => e.ManagerName, dto.ManagerName));

                if (dto.Year.HasValue)
                    updates.Add(updateBuilder.Set(e => e.Year, dto.Year.Value));

                if (dto.YearlyCapacityMonths.HasValue)
                    updates.Add(updateBuilder.Set(e => e.YearlyCapacityMonths, dto.YearlyCapacityMonths.Value));

                if (dto.UpcomingEvent is not null)
                    updates.Add(updateBuilder.Set(e => e.UpcomingEvent, dto.UpcomingEvent));

                if (dto.Notes is not null)
                    updates.Add(updateBuilder.Set(e => e.Notes, dto.Notes));

                if (dto.IsActive.HasValue)
                    updates.Add(updateBuilder.Set(e => e.IsActive, dto.IsActive.Value));

                if (!updates.Any())
                {
                    _logger.LogWarning(
                        "Employee update skipped because no changes were provided. EmployeeId: {EmployeeId}",
                        id);

                    return false;
                }

                var result = await _employeesCollection.UpdateOneAsync(
                    e => e.Id == id,
                    updateBuilder.Combine(updates));

                var updated = result.ModifiedCount > 0;

                if (updated)
                {
                    _logger.LogInformation(
                        "Employee updated successfully. EmployeeId: {EmployeeId}",
                        id);
                }
                else
                {
                    _logger.LogWarning(
                        "Employee update made no changes or employee was not found. EmployeeId: {EmployeeId}",
                        id);
                }

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Employee update failed. EmployeeId: {EmployeeId}",
                    id);

                throw;
            }
        }

        public async Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto)
        {
            _logger.LogInformation(
                "Adding employee allocation. EmployeeId: {EmployeeId}",
                employeeId);

            try
            {
                if (dto is null)
                {
                    _logger.LogWarning(
                        "Allocation creation rejected because request data was missing. EmployeeId: {EmployeeId}",
                        employeeId);

                    return false;
                }

                var employee = await _employeesCollection
                    .Find(e => e.Id == employeeId)
                    .FirstOrDefaultAsync();

                if (employee is null)
                {
                    _logger.LogWarning(
                        "Allocation creation failed because employee was not found. EmployeeId: {EmployeeId}",
                        employeeId);

                    return false;
                }

                if (!employee.IsActive)
                {
                    _logger.LogWarning(
                        "Allocation creation failed because employee is inactive. EmployeeId: {EmployeeId}",
                        employeeId);

                    return false;
                }

                var allocations = employee.Allocations ?? new List<EmployeeAllocation>();

                var alreadyAssigned = allocations.Any(a =>
                    string.Equals(a.SystemId, dto.SystemId, StringComparison.OrdinalIgnoreCase));

                if (alreadyAssigned)
                {
                    _logger.LogWarning(
                        "Allocation creation failed because employee is already assigned to the system. EmployeeId: {EmployeeId}, SystemId: {SystemId}",
                        employeeId,
                        dto.SystemId);

                    return false;
                }

                var remaining = employee.YearlyCapacityMonths -
                                allocations.Sum(a => a.ActualMonths);

                if (dto.ActualMonths <= 0 || dto.ActualMonths > remaining)
                {
                    _logger.LogWarning(
                        "Allocation creation failed because requested months are invalid. EmployeeId: {EmployeeId}, RequestedMonths: {RequestedMonths}, RemainingMonths: {RemainingMonths}",
                        employeeId,
                        dto.ActualMonths,
                        remaining);

                    return false;
                }

                var allocation = _mapper.Map<EmployeeAllocation>(dto);

                var result = await _employeesCollection.UpdateOneAsync(
                    e => e.Id == employeeId,
                    Builders<Employee>.Update.Push(e => e.Allocations, allocation));

                var added = result.ModifiedCount > 0;

                if (added)
                {
                    _logger.LogInformation(
                        "Employee allocation added successfully. EmployeeId: {EmployeeId}, SystemId: {SystemId}",
                        employeeId,
                        dto.SystemId);
                }
                else
                {
                    _logger.LogWarning(
                        "Employee allocation was not added. EmployeeId: {EmployeeId}, SystemId: {SystemId}",
                        employeeId,
                        dto.SystemId);
                }

                return added;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Employee allocation creation failed. EmployeeId: {EmployeeId}",
                    employeeId);

                throw;
            }
        }

        public async Task<BulkAssignEmployeesResultDto> BulkAssignEmployeesToSystemAsync(
    BulkAssignEmployeesDto dto)
        {
            _logger.LogInformation(
                "Assigning employees to system in bulk. SystemId: {SystemId}, RequestedEmployeeCount: {RequestedEmployeeCount}",
                dto?.SystemId,
                dto?.Employees?.Count ?? 0);

            try
            {
                var errors = new List<string>();

                if (dto is null)
                {
                    _logger.LogWarning(
                        "Bulk assignment rejected because request data was missing.");

                    return new BulkAssignEmployeesResultDto(
                        false,
                        0,
                        new List<string> { "Missing request body." });
                }

                if (string.IsNullOrWhiteSpace(dto.SystemId))
                {
                    errors.Add("SystemId is required.");
                }

                if (dto.Employees is null || dto.Employees.Count == 0)
                {
                    errors.Add("At least one employee must be selected.");
                }

                var systemExists = await _systemsCollection
                    .Find(system => system.Id == dto.SystemId)
                    .AnyAsync();

                if (!systemExists)
                {
                    errors.Add("System was not found.");
                }

                if (errors.Any())
                {
                    _logger.LogWarning(
                        "Bulk assignment validation failed. SystemId: {SystemId}, ErrorCount: {ErrorCount}",
                        dto.SystemId,
                        errors.Count);

                    return new BulkAssignEmployeesResultDto(
                        false,
                        0,
                        errors);
                }

                var duplicateEmployeeIds = dto.Employees
                    .GroupBy(item => item.EmployeeId)
                    .Where(group => group.Count() > 1)
                    .Select(group => group.Key)
                    .ToList();

                if (duplicateEmployeeIds.Any())
                {
                    errors.Add(
                        "Each employee may appear only once in the assignment request.");

                    _logger.LogWarning(
                        "Bulk assignment request contained duplicate employee IDs. SystemId: {SystemId}, DuplicateCount: {DuplicateCount}",
                        dto.SystemId,
                        duplicateEmployeeIds.Count);

                    return new BulkAssignEmployeesResultDto(
                        false,
                        0,
                        errors);
                }

                var employeeIds = dto.Employees
                    .Select(item => item.EmployeeId)
                    .Distinct()
                    .ToList();

                var employees = await _employeesCollection
                    .Find(employee => employeeIds.Contains(employee.Id!))
                    .ToListAsync();

                var updates = new List<WriteModel<Employee>>();

                foreach (var item in dto.Employees)
                {
                    var employee = employees.FirstOrDefault(
                        currentEmployee =>
                            currentEmployee.Id == item.EmployeeId);

                    if (employee is null)
                    {
                        errors.Add(
                            $"Employee {item.EmployeeId} was not found.");

                        continue;
                    }

                    if (!employee.IsActive)
                    {
                        errors.Add(
                            $"{employee.FullName} is not active.");

                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(item.RoleInSystem))
                    {
                        errors.Add(
                            $"Role is required for {employee.FullName}.");

                        continue;
                    }

                    if (item.PlannedMonths <= 0 || item.ActualMonths <= 0)
                    {
                        errors.Add(
                            $"Months must be greater than 0 for {employee.FullName}.");

                        continue;
                    }

                    var allocations =
                        employee.Allocations ??
                        new List<EmployeeAllocation>();

                    var currentAllocation = allocations.FirstOrDefault(
                        allocation =>
                            string.Equals(
                                allocation.SystemId,
                                dto.SystemId,
                                StringComparison.OrdinalIgnoreCase));

                    var allocatedOutsideCurrentSystem = allocations
                        .Where(allocation =>
                            !string.Equals(
                                allocation.SystemId,
                                dto.SystemId,
                                StringComparison.OrdinalIgnoreCase))
                        .Sum(allocation => allocation.ActualMonths);

                    var maxAssignableMonths =
                        employee.YearlyCapacityMonths -
                        allocatedOutsideCurrentSystem;

                    if (item.ActualMonths > maxAssignableMonths)
                    {
                        errors.Add(
                            $"{employee.FullName} can be assigned up to {maxAssignableMonths} months in this system.");

                        continue;
                    }

                    if (currentAllocation is not null)
                    {
                        currentAllocation.RoleInSystem =
                            item.RoleInSystem.Trim();

                        currentAllocation.PlannedMonths =
                            item.PlannedMonths;

                        currentAllocation.ActualMonths =
                            item.ActualMonths;

                        updates.Add(
                            new UpdateOneModel<Employee>(
                                Builders<Employee>.Filter.Eq(
                                    currentEmployee =>
                                        currentEmployee.Id,
                                    employee.Id),
                                Builders<Employee>.Update.Set(
                                    currentEmployee =>
                                        currentEmployee.Allocations,
                                    allocations)
                            )
                        );

                        continue;
                    }

                    var newAllocation = new EmployeeAllocation
                    {
                        SystemId = dto.SystemId,
                        RoleInSystem = item.RoleInSystem.Trim(),
                        PlannedMonths = item.PlannedMonths,
                        ActualMonths = item.ActualMonths
                    };

                    updates.Add(
                        new UpdateOneModel<Employee>(
                            Builders<Employee>.Filter.Eq(
                                currentEmployee =>
                                    currentEmployee.Id,
                                employee.Id),
                            Builders<Employee>.Update.Push(
                                currentEmployee =>
                                    currentEmployee.Allocations,
                                newAllocation)
                        )
                    );
                }

                if (errors.Any())
                {
                    _logger.LogWarning(
                        "Bulk assignment rejected after employee validation. SystemId: {SystemId}, ErrorCount: {ErrorCount}",
                        dto.SystemId,
                        errors.Count);

                    return new BulkAssignEmployeesResultDto(
                        false,
                        0,
                        errors);
                }

                if (!updates.Any())
                {
                    _logger.LogWarning(
                        "Bulk assignment produced no valid updates. SystemId: {SystemId}",
                        dto.SystemId);

                    return new BulkAssignEmployeesResultDto(
                        false,
                        0,
                        new List<string>
                        {
                    "No valid employees to assign or update."
                        });
                }

                var result = await _employeesCollection
                    .BulkWriteAsync(updates);

                _logger.LogInformation(
                    "Bulk employee assignment completed successfully. SystemId: {SystemId}, ModifiedEmployeeCount: {ModifiedEmployeeCount}",
                    dto.SystemId,
                    result.ModifiedCount);

                return new BulkAssignEmployeesResultDto(
                    true,
                    (int)result.ModifiedCount,
                    new List<string>());
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Bulk employee assignment failed. SystemId: {SystemId}",
                    dto?.SystemId);

                throw;
            }
        }

        public async Task<bool> DeleteEmployeeAsync(string id)
        {
            _logger.LogInformation(
                "Deactivating employee. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var result = await _employeesCollection.UpdateOneAsync(
                    e => e.Id == id,
                    Builders<Employee>.Update.Set(e => e.IsActive, false));

                var deleted = result.ModifiedCount > 0;

                if (deleted)
                {
                    _logger.LogInformation(
                        "Employee deactivated successfully. EmployeeId: {EmployeeId}",
                        id);
                }
                else
                {
                    _logger.LogWarning(
                        "Employee deactivation made no changes or employee was not found. EmployeeId: {EmployeeId}",
                        id);
                }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Employee deactivation failed. EmployeeId: {EmployeeId}",
                    id);

                throw;
            }
        }

        private static double GetAllocatedMonths(Employee employee) =>
            (employee.Allocations ?? new List<EmployeeAllocation>())
            .Sum(a => a.ActualMonths);

        private static string GetAvailabilityStatus(Employee employee)
        {
            var remaining = employee.YearlyCapacityMonths - GetAllocatedMonths(employee);

            return remaining > 0
                ? "Available"
                : (remaining == 0 ? "Balanced" : "Overloaded");
        }

        private static int GetAssignedSystemsCount(Employee employee) =>
            (employee.Allocations ?? new List<EmployeeAllocation>())
            .Select(a => a.SystemId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        private static string GetSystemCapacityStatus(
            SystemModel system,
            IEnumerable<Employee> allEmployees)
        {
            var allocated = allEmployees
                .SelectMany(e => e.Allocations ?? new List<EmployeeAllocation>())
                .Where(a => string.Equals(
                    a.SystemId,
                    system.Id,
                    StringComparison.OrdinalIgnoreCase))
                .Sum(a => a.ActualMonths);

            var gap = system.RequiredCapacityMonths - allocated;

            return gap > 0
                ? "Shortage"
                : (gap == 0 ? "Balanced" : "Excess");
        }
    }
}