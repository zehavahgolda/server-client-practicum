using HR_System.DTOs.OrganizationEvents;
using HR_System.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class OrganizationEventService : IOrganizationEventService
    {
        private static readonly HashSet<string> AllowedScopeTypes = new(StringComparer.Ordinal)
        {
            "AllOrganization",
            "SelectedSystems"
        };

        private readonly IMongoCollection<OrganizationEvent> _organizationEventsCollection;
        private readonly IMongoCollection<SystemModel> _systemsCollection;

        public OrganizationEventService(IMongoDatabase database)
        {
            _organizationEventsCollection = database.GetCollection<OrganizationEvent>("OrganizationEvents");
            _systemsCollection = database.GetCollection<SystemModel>("systems");
        }

        public async Task<List<OrganizationEventDto>> GetOrganizationEventsAsync(
            string? search = null,
            string? status = null,
            string? scopeType = null,
            string? systemId = null)
        {
            var normalizedSearch = search?.Trim();
            var normalizedStatus = status?.Trim();
            var normalizedScopeType = scopeType?.Trim();
            var normalizedSystemId = systemId?.Trim();

            if (!string.IsNullOrWhiteSpace(normalizedStatus) &&
                !string.Equals(normalizedStatus, "Active", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(normalizedStatus, "Future", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(normalizedStatus, "Completed", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Status filter is invalid.", nameof(status));
            }

            if (!string.IsNullOrWhiteSpace(normalizedScopeType) && !AllowedScopeTypes.Contains(normalizedScopeType))
            {
                throw new ArgumentException("ScopeType filter is invalid.", nameof(scopeType));
            }

            if (!string.IsNullOrWhiteSpace(normalizedSystemId))
            {
                ValidateObjectId(normalizedSystemId, nameof(systemId));
            }

            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var activeSystemsById = systems
                .Where(system => system.IsActive && !string.IsNullOrWhiteSpace(system.Id))
                .GroupBy(system => system.Id!, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

            if (!string.IsNullOrWhiteSpace(normalizedSystemId) && !activeSystemsById.ContainsKey(normalizedSystemId))
            {
                throw new KeyNotFoundException("System was not found.");
            }

            var events = await _organizationEventsCollection
                .Find(organizationEvent => !organizationEvent.IsDeleted)
                .SortBy(organizationEvent => organizationEvent.StartDate)
                .ToListAsync();

            var filtered = events.Where(organizationEvent =>
            {
                if (!string.IsNullOrWhiteSpace(normalizedSearch))
                {
                    var title = organizationEvent.Title?.Trim() ?? string.Empty;
                    var description = organizationEvent.Description?.Trim() ?? string.Empty;

                    if (!title.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) &&
                        !description.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                if (!string.IsNullOrWhiteSpace(normalizedScopeType) &&
                    !string.Equals(organizationEvent.ScopeType, normalizedScopeType, StringComparison.Ordinal))
                {
                    return false;
                }

                if (!string.IsNullOrWhiteSpace(normalizedSystemId))
                {
                    var matchesSystem = string.Equals(organizationEvent.ScopeType, "AllOrganization", StringComparison.Ordinal) ||
                        organizationEvent.TargetSystemIds.Contains(normalizedSystemId, StringComparer.Ordinal);

                    if (!matchesSystem)
                    {
                        return false;
                    }
                }

                if (!string.IsNullOrWhiteSpace(normalizedStatus) &&
                    !string.Equals(GetStatus(organizationEvent), normalizedStatus, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                return true;
            });

            return filtered
                .OrderBy(organizationEvent => GetStatusSortOrder(GetStatus(organizationEvent)))
                .ThenBy(organizationEvent => organizationEvent.StartDate)
                .Select(organizationEvent => MapToDto(organizationEvent, activeSystemsById))
                .ToList();
        }

        public async Task<List<OrganizationEventDto>> GetOrganizationEventsForSystemAsync(string systemId)
        {
            ValidateObjectId(systemId, nameof(systemId));

            var system = await _systemsCollection
                .Find(currentSystem => currentSystem.Id == systemId && currentSystem.IsActive)
                .FirstOrDefaultAsync();

            if (system is null)
            {
                throw new KeyNotFoundException("System was not found.");
            }

            return await GetOrganizationEventsAsync(systemId: systemId);
        }

        public async Task<OrganizationEventDto> CreateOrganizationEventAsync(OrganizationEventCreateDto dto)
        {
            var normalized = await NormalizeAndValidateMutationAsync(
                dto.Title,
                dto.Description,
                dto.StartDate,
                dto.EndDate,
                dto.ScopeType,
                dto.TargetSystemIds);

            var organizationEvent = new OrganizationEvent
            {
                Title = normalized.Title,
                Description = normalized.Description,
                StartDate = ToUtcDate(normalized.StartDate),
                EndDate = normalized.EndDate.HasValue ? ToUtcDate(normalized.EndDate.Value) : null,
                ScopeType = normalized.ScopeType,
                TargetSystemIds = normalized.TargetSystemIds,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            await _organizationEventsCollection.InsertOneAsync(organizationEvent);

            return MapToDto(organizationEvent, normalized.ActiveSystemsById);
        }

        public async Task<OrganizationEventDto> UpdateOrganizationEventAsync(string id, OrganizationEventUpdateDto dto)
        {
            ValidateObjectId(id, nameof(id));

            var existingEvent = await _organizationEventsCollection
                .Find(organizationEvent => organizationEvent.Id == id && !organizationEvent.IsDeleted)
                .FirstOrDefaultAsync();

            if (existingEvent is null)
            {
                throw new KeyNotFoundException("Organization event was not found.");
            }

            var normalized = await NormalizeAndValidateMutationAsync(
                dto.Title,
                dto.Description,
                dto.StartDate,
                dto.EndDate,
                dto.ScopeType,
                dto.TargetSystemIds);

            existingEvent.Title = normalized.Title;
            existingEvent.Description = normalized.Description;
            existingEvent.StartDate = ToUtcDate(normalized.StartDate);
            existingEvent.EndDate = normalized.EndDate.HasValue ? ToUtcDate(normalized.EndDate.Value) : null;
            existingEvent.ScopeType = normalized.ScopeType;
            existingEvent.TargetSystemIds = normalized.TargetSystemIds;
            existingEvent.UpdatedAt = DateTime.UtcNow;

            await _organizationEventsCollection.ReplaceOneAsync(
                organizationEvent => organizationEvent.Id == id,
                existingEvent);

            return MapToDto(existingEvent, normalized.ActiveSystemsById);
        }

        public async Task<bool> SoftDeleteOrganizationEventAsync(string id)
        {
            ValidateObjectId(id, nameof(id));

            var result = await _organizationEventsCollection.UpdateOneAsync(
                organizationEvent => organizationEvent.Id == id && !organizationEvent.IsDeleted,
                Builders<OrganizationEvent>.Update
                    .Set(organizationEvent => organizationEvent.IsDeleted, true)
                    .Set(organizationEvent => organizationEvent.UpdatedAt, DateTime.UtcNow));

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException("Organization event was not found.");
            }

            return result.ModifiedCount > 0;
        }

        private async Task<NormalizedOrganizationEventMutation> NormalizeAndValidateMutationAsync(
            string? title,
            string? description,
            DateOnly startDate,
            DateOnly? endDate,
            string? scopeType,
            List<string>? targetSystemIds)
        {
            var normalizedTitle = title?.Trim() ?? string.Empty;
            var normalizedScopeType = scopeType?.Trim() ?? string.Empty;
            var normalizedDescription = NormalizeOptional(description);

            if (string.IsNullOrWhiteSpace(normalizedTitle))
            {
                throw new ArgumentException("Title is required.", nameof(title));
            }

            if (startDate == default)
            {
                throw new ArgumentException("StartDate is required.", nameof(startDate));
            }

            if (endDate.HasValue && endDate.Value < startDate)
            {
                throw new ArgumentException("EndDate cannot be earlier than StartDate.", nameof(endDate));
            }

            if (!AllowedScopeTypes.Contains(normalizedScopeType))
            {
                throw new ArgumentException("ScopeType is invalid.", nameof(scopeType));
            }

            var normalizedTargetSystemIds = NormalizeTargetSystemIds(targetSystemIds);

            var systems = await _systemsCollection.Find(_ => true).ToListAsync();
            var activeSystemsById = systems
                .Where(system => system.IsActive && !string.IsNullOrWhiteSpace(system.Id))
                .GroupBy(system => system.Id!, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

            if (string.Equals(normalizedScopeType, "AllOrganization", StringComparison.Ordinal))
            {
                normalizedTargetSystemIds = new List<string>();
            }
            else
            {
                if (normalizedTargetSystemIds.Count == 0)
                {
                    throw new ArgumentException("At least one target system is required.", nameof(targetSystemIds));
                }

                foreach (var targetSystemId in normalizedTargetSystemIds)
                {
                    ValidateObjectId(targetSystemId, nameof(targetSystemIds));

                    if (!activeSystemsById.ContainsKey(targetSystemId))
                    {
                        throw new KeyNotFoundException("One or more target systems were not found or are inactive.");
                    }
                }
            }

            return new NormalizedOrganizationEventMutation
            {
                Title = normalizedTitle,
                Description = normalizedDescription,
                StartDate = startDate,
                EndDate = endDate,
                ScopeType = normalizedScopeType,
                TargetSystemIds = normalizedTargetSystemIds,
                ActiveSystemsById = activeSystemsById
            };
        }

        private static List<string> NormalizeTargetSystemIds(List<string>? targetSystemIds) =>
            (targetSystemIds ?? new List<string>())
                .Where(targetSystemId => !string.IsNullOrWhiteSpace(targetSystemId))
                .Select(targetSystemId => targetSystemId.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

        private static string? NormalizeOptional(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static void ValidateObjectId(string value, string parameterName)
        {
            if (!ObjectId.TryParse(value, out _))
            {
                throw new ArgumentException($"{parameterName} must be a valid ObjectId.", parameterName);
            }
        }

        private static DateTime ToUtcDate(DateOnly value) =>
            DateTime.SpecifyKind(value.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        private static string GetStatus(OrganizationEvent organizationEvent)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var startDate = DateOnly.FromDateTime(organizationEvent.StartDate);
            var endDate = organizationEvent.EndDate.HasValue
                ? DateOnly.FromDateTime(organizationEvent.EndDate.Value)
                : (DateOnly?)null;

            if (endDate.HasValue && endDate.Value < today)
            {
                return "Completed";
            }

            if (startDate > today)
            {
                return "Future";
            }

            return "Active";
        }

        private static int GetStatusSortOrder(string status) => status switch
        {
            "Active" => 0,
            "Future" => 1,
            _ => 2
        };

        private static OrganizationEventDto MapToDto(
            OrganizationEvent organizationEvent,
            IReadOnlyDictionary<string, SystemModel> activeSystemsById)
        {
            var targetSystems = organizationEvent.TargetSystemIds
                .Where(activeSystemsById.ContainsKey)
                .Select(targetSystemId => new OrganizationEventTargetSystemDto(
                    targetSystemId,
                    activeSystemsById[targetSystemId].Name))
                .ToList();

            return new OrganizationEventDto(
                organizationEvent.Id ?? string.Empty,
                organizationEvent.Title,
                organizationEvent.Description,
                DateOnly.FromDateTime(organizationEvent.StartDate),
                organizationEvent.EndDate.HasValue ? DateOnly.FromDateTime(organizationEvent.EndDate.Value) : null,
                organizationEvent.ScopeType,
                organizationEvent.TargetSystemIds.ToList(),
                targetSystems,
                GetStatus(organizationEvent),
                organizationEvent.CreatedAt,
                organizationEvent.UpdatedAt);
        }

        private sealed class NormalizedOrganizationEventMutation
        {
            public string Title { get; init; } = string.Empty;
            public string? Description { get; init; }
            public DateOnly StartDate { get; init; }
            public DateOnly? EndDate { get; init; }
            public string ScopeType { get; init; } = string.Empty;
            public List<string> TargetSystemIds { get; init; } = new();
            public IReadOnlyDictionary<string, SystemModel> ActiveSystemsById { get; init; } =
                new Dictionary<string, SystemModel>(StringComparer.Ordinal);
        }
    }
}