using HR_System.DTOs.Managers;
using HR_System.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class ManagerService : IManagerService
    {
        private readonly IMongoCollection<ManagerDesignation> _managerDesignationsCollection;
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IManagerAssignmentUsageResolver _managerAssignmentUsageResolver;

        public ManagerService(
            IMongoDatabase database,
            IManagerAssignmentUsageResolver managerAssignmentUsageResolver)
        {
            _managerDesignationsCollection = database.GetCollection<ManagerDesignation>("ManagerDesignations");
            _employeesCollection = database.GetCollection<Employee>("employees");
            _managerAssignmentUsageResolver = managerAssignmentUsageResolver;

            EnsureIndexes();
        }

        public async Task<List<ManagerListItemDto>> GetManagersAsync(string? status = null, string? search = null)
        {
            var normalizedStatus = NormalizeStatus(status);
            var normalizedSearch = search?.Trim();

            var designations = await _managerDesignationsCollection
                .Find(_ => true)
                .ToListAsync();

            if (normalizedStatus == "active")
            {
                designations = designations.Where(d => d.IsActive).ToList();
            }
            else if (normalizedStatus == "inactive")
            {
                designations = designations.Where(d => !d.IsActive).ToList();
            }

            var employeeIds = designations
                .Select(d => d.EmployeeId)
                .Where(IsValidObjectId)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var employees = await _employeesCollection
                .Find(e => e.Id != null && employeeIds.Contains(e.Id))
                .ToListAsync();

            var employeesById = employees
                .Where(e => !string.IsNullOrWhiteSpace(e.Id))
                .ToDictionary(e => e.Id!, StringComparer.OrdinalIgnoreCase);

            var rows = new List<ManagerListItemDto>();

            foreach (var designation in designations)
            {
                if (!employeesById.TryGetValue(designation.EmployeeId, out var employee))
                {
                    continue;
                }

                if (!employee.IsActive)
                {
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(normalizedSearch) &&
                    !employee.FullName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var usage = await _managerAssignmentUsageResolver
                    .ResolveUsageByManagerEmployeeAsync(employee);

                rows.Add(new ManagerListItemDto(
                    designation.Id ?? string.Empty,
                    designation.EmployeeId,
                    employee.FullName,
                    employee.ProfessionalCategory,
                    employee.ProfessionalSubCategory,
                    designation.IsActive,
                    designation.CreatedAt,
                    designation.UpdatedAt,
                    designation.DeactivatedAt,
                    usage.AssignedEmployeesCount
                ));
            }

            return rows
                .OrderBy(r => r.FullName)
                .ToList();
        }

        public async Task<List<ManagerCandidateDto>> GetManagerCandidatesAsync(string? search = null)
        {
            var normalizedSearch = search?.Trim();

            var activeEmployees = await _employeesCollection
                .Find(employee => employee.IsActive)
                .ToListAsync();

            var designations = await _managerDesignationsCollection
                .Find(_ => true)
                .ToListAsync();

            var designationByEmployeeId = designations
                .Where(designation => IsValidObjectId(designation.EmployeeId))
                .GroupBy(designation => designation.EmployeeId, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => group.Key,
                    group => group.OrderByDescending(item => item.CreatedAt).First(),
                    StringComparer.OrdinalIgnoreCase);

            var rows = activeEmployees
                .Where(employee => !string.IsNullOrWhiteSpace(employee.Id))
                .Where(employee =>
                    string.IsNullOrWhiteSpace(normalizedSearch) ||
                    employee.FullName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase))
                .Select(employee =>
                {
                    designationByEmployeeId.TryGetValue(employee.Id!, out var designation);

                    return new ManagerCandidateDto(
                        employee.Id!,
                        employee.FullName,
                        employee.ProfessionalCategory,
                        employee.ProfessionalSubCategory,
                        designation?.IsActive == true,
                        designation is not null && designation.IsActive == false
                    );
                })
                .OrderBy(candidate => candidate.FullName)
                .ToList();

            return rows;
        }

        public async Task<ManagerMutationResultDto> AddManagerAsync(ManagerCreateDto dto)
        {
            if (dto is null)
            {
                throw new ArgumentException("Request body is required.", nameof(dto));
            }

            var employeeId = dto.EmployeeId?.Trim() ?? string.Empty;

            if (!IsValidObjectId(employeeId))
            {
                throw new ArgumentException("EmployeeId must be a valid ObjectId.", nameof(dto.EmployeeId));
            }

            var employee = await _employeesCollection
                .Find(e => e.Id == employeeId)
                .FirstOrDefaultAsync();

            if (employee is null)
            {
                throw new BusinessValidationException("לא ניתן להוסיף מנהל: העובד לא נמצא.");
            }

            if (!employee.IsActive)
            {
                throw new BusinessValidationException("לא ניתן להוסיף מנהל: העובד אינו פעיל.");
            }

            var existingDesignation = await _managerDesignationsCollection
                .Find(designation => designation.EmployeeId == employeeId)
                .FirstOrDefaultAsync();

            if (existingDesignation is null)
            {
                var now = DateTime.UtcNow;

                var newDesignation = new ManagerDesignation
                {
                    EmployeeId = employeeId,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                    DeactivatedAt = null,
                    DeactivationReason = null
                };

                await _managerDesignationsCollection.InsertOneAsync(newDesignation);

                var manager = await BuildManagerListItemAsync(newDesignation, employee);

                return new ManagerMutationResultDto(
                    "created",
                    "המנהל נוסף בהצלחה.",
                    manager
                );
            }

            if (existingDesignation.IsActive)
            {
                var manager = await BuildManagerListItemAsync(existingDesignation, employee);

                return new ManagerMutationResultDto(
                    "alreadyActive",
                    "העובד כבר מוגדר כמנהל פעיל.",
                    manager
                );
            }

            var reactivatedAt = DateTime.UtcNow;
            var updateResult = await _managerDesignationsCollection.UpdateOneAsync(
                designation => designation.Id == existingDesignation.Id,
                Builders<ManagerDesignation>.Update
                    .Set(designation => designation.IsActive, true)
                    .Set(designation => designation.UpdatedAt, reactivatedAt)
                    .Set(designation => designation.DeactivatedAt, null)
                    .Set(designation => designation.DeactivationReason, null));

            if (updateResult.MatchedCount == 0)
            {
                throw new BusinessValidationException("לא ניתן היה להפעיל מחדש את המנהל.");
            }

            existingDesignation.IsActive = true;
            existingDesignation.UpdatedAt = reactivatedAt;
            existingDesignation.DeactivatedAt = null;
            existingDesignation.DeactivationReason = null;

            var reactivatedManager = await BuildManagerListItemAsync(existingDesignation, employee);

            return new ManagerMutationResultDto(
                "reactivated",
                "המנהל הופעל מחדש בהצלחה.",
                reactivatedManager
            );
        }

        public async Task<ManagerDeactivateResultDto> DeactivateManagerAsync(string designationId, string? deactivationReason = null)
        {
            if (!IsValidObjectId(designationId))
            {
                throw new ArgumentException("Designation id is invalid.", nameof(designationId));
            }

            var designation = await _managerDesignationsCollection
                .Find(item => item.Id == designationId)
                .FirstOrDefaultAsync();

            if (designation is null)
            {
                throw new KeyNotFoundException("Manager designation was not found.");
            }

            var employee = await _employeesCollection
                .Find(e => e.Id == designation.EmployeeId)
                .FirstOrDefaultAsync();

            if (employee is null)
            {
                throw new BusinessValidationException("לא ניתן לעדכן מנהל: העובד המקושר לא נמצא.");
            }

            if (!designation.IsActive)
            {
                var currentInactive = await BuildManagerListItemAsync(designation, employee);
                return new ManagerDeactivateResultDto(
                    true,
                    0,
                    "המנהל כבר אינו פעיל.",
                    currentInactive
                );
            }

            var usage = await _managerAssignmentUsageResolver
                .ResolveUsageByManagerEmployeeAsync(employee);

            var affectedEmployeesCount = usage.AssignedEmployeesCount;

            if (affectedEmployeesCount > 0)
            {
                var ambiguityNote = usage.IsAmbiguousManagerIdentity
                    ? " זוהתה עמימות בשם המנהל (שם זהה למספר עובדים פעילים)."
                    : string.Empty;

                throw new BusinessValidationException(
                    $"לא ניתן להשבית את המנהל משום שהוא משויך כעת ל-{affectedEmployeesCount} עובדים.{ambiguityNote}",
                    affectedEmployeesCount);
            }

            var now = DateTime.UtcNow;
            var normalizedReason = string.IsNullOrWhiteSpace(deactivationReason)
                ? null
                : deactivationReason.Trim();

            var update = Builders<ManagerDesignation>.Update
                .Set(item => item.IsActive, false)
                .Set(item => item.UpdatedAt, now)
                .Set(item => item.DeactivatedAt, now)
                .Set(item => item.DeactivationReason, normalizedReason);

            var result = await _managerDesignationsCollection.UpdateOneAsync(
                item => item.Id == designationId,
                update);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException("Manager designation was not found.");
            }

            designation.IsActive = false;
            designation.UpdatedAt = now;
            designation.DeactivatedAt = now;
            designation.DeactivationReason = normalizedReason;

            var manager = await BuildManagerListItemAsync(designation, employee);

            return new ManagerDeactivateResultDto(
                true,
                0,
                "המנהל הושבת בהצלחה.",
                manager
            );
        }

        public async Task<ManagerMutationResultDto> ReactivateManagerAsync(string designationId)
        {
            if (!IsValidObjectId(designationId))
            {
                throw new ArgumentException("Designation id is invalid.", nameof(designationId));
            }

            var designation = await _managerDesignationsCollection
                .Find(item => item.Id == designationId)
                .FirstOrDefaultAsync();

            if (designation is null)
            {
                throw new KeyNotFoundException("Manager designation was not found.");
            }

            var employee = await _employeesCollection
                .Find(e => e.Id == designation.EmployeeId)
                .FirstOrDefaultAsync();

            if (employee is null)
            {
                throw new BusinessValidationException("לא ניתן להפעיל מחדש מנהל: העובד המקושר לא נמצא.");
            }

            if (!employee.IsActive)
            {
                throw new BusinessValidationException("לא ניתן להפעיל מחדש מנהל: העובד המקושר אינו פעיל.");
            }

            if (designation.IsActive)
            {
                var alreadyActive = await BuildManagerListItemAsync(designation, employee);
                return new ManagerMutationResultDto(
                    "alreadyActive",
                    "המנהל כבר פעיל.",
                    alreadyActive
                );
            }

            var now = DateTime.UtcNow;
            var update = Builders<ManagerDesignation>.Update
                .Set(item => item.IsActive, true)
                .Set(item => item.UpdatedAt, now)
                .Set(item => item.DeactivatedAt, null)
                .Set(item => item.DeactivationReason, null);

            var result = await _managerDesignationsCollection.UpdateOneAsync(
                item => item.Id == designationId,
                update);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException("Manager designation was not found.");
            }

            designation.IsActive = true;
            designation.UpdatedAt = now;
            designation.DeactivatedAt = null;
            designation.DeactivationReason = null;

            var manager = await BuildManagerListItemAsync(designation, employee);

            return new ManagerMutationResultDto(
                "reactivated",
                "המנהל הופעל מחדש בהצלחה.",
                manager
            );
        }

        private async Task<ManagerListItemDto> BuildManagerListItemAsync(ManagerDesignation designation, Employee employee)
        {
            var usage = await _managerAssignmentUsageResolver
                .ResolveUsageByManagerEmployeeAsync(employee);

            return new ManagerListItemDto(
                designation.Id ?? string.Empty,
                designation.EmployeeId,
                employee.FullName,
                employee.ProfessionalCategory,
                employee.ProfessionalSubCategory,
                designation.IsActive,
                designation.CreatedAt,
                designation.UpdatedAt,
                designation.DeactivatedAt,
                usage.AssignedEmployeesCount
            );
        }

        private static bool IsValidObjectId(string? value)
        {
            return !string.IsNullOrWhiteSpace(value) && ObjectId.TryParse(value, out _);
        }

        private static string NormalizeStatus(string? status)
        {
            var normalized = status?.Trim().ToLowerInvariant();

            if (normalized == "inactive" || normalized == "all")
            {
                return normalized;
            }

            return "active";
        }

        private void EnsureIndexes()
        {
            var employeeIndexKeys = Builders<ManagerDesignation>.IndexKeys.Ascending(item => item.EmployeeId);
            var employeeIndexOptions = new CreateIndexOptions
            {
                Name = "ux_manager_designations_employee_id",
                Unique = true
            };

            var statusUpdatedIndexKeys = Builders<ManagerDesignation>.IndexKeys
                .Ascending(item => item.IsActive)
                .Descending(item => item.UpdatedAt);

            var statusUpdatedIndexOptions = new CreateIndexOptions
            {
                Name = "ix_manager_designations_status_updated_at"
            };

            _managerDesignationsCollection.Indexes.CreateMany(new[]
            {
                new CreateIndexModel<ManagerDesignation>(employeeIndexKeys, employeeIndexOptions),
                new CreateIndexModel<ManagerDesignation>(statusUpdatedIndexKeys, statusUpdatedIndexOptions)
            });
        }
    }
}
