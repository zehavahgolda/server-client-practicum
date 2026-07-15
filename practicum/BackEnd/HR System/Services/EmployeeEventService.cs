using HR_System.DTOs.Employees;
using HR_System.Models;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class EmployeeEventService : IEmployeeEventService
    {
        private readonly IMongoCollection<Employee> _employeesCollection;
        private readonly IMongoCollection<EmployeeEvent> _employeeEventsCollection;
        private readonly ILogger<EmployeeEventService> _logger;

        public EmployeeEventService(
            IMongoDatabase database,
            ILogger<EmployeeEventService> logger)
        {
            _employeesCollection = database.GetCollection<Employee>("employees");
            _employeeEventsCollection = database.GetCollection<EmployeeEvent>("EmployeeEvents");
            _logger = logger;
        }

        public async Task<List<EmployeeEventDto>> GetEmployeeEventsAsync(string employeeId)
        {
            ValidateObjectId(employeeId, nameof(employeeId));
            await EnsureEmployeeExistsAsync(employeeId);

            _logger.LogInformation("Retrieving employee events. EmployeeId: {EmployeeId}", employeeId);

            var events = await _employeeEventsCollection
                .Find(employeeEvent => employeeEvent.EmployeeId == employeeId && !employeeEvent.IsDeleted)
                .SortByDescending(employeeEvent => employeeEvent.StartDate)
                .ToListAsync();

            return events.Select(MapToDto).ToList();
        }

        public async Task<EmployeeEventBatchResponseDto> GetEmployeeEventsBatchAsync(EmployeeEventBatchRequestDto? request)
        {
            var normalizedIds = ValidateAndNormalizeBatchRequest(request);

            if (normalizedIds.Count == 0)
            {
                return new EmployeeEventBatchResponseDto(new List<EmployeeEventBatchItemDto>());
            }

            _logger.LogInformation(
                "Retrieving employee events batch. EmployeeCount: {EmployeeCount}",
                normalizedIds.Count);

            var filter = Builders<EmployeeEvent>.Filter.And(
                Builders<EmployeeEvent>.Filter.In(employeeEvent => employeeEvent.EmployeeId, normalizedIds),
                Builders<EmployeeEvent>.Filter.Eq(employeeEvent => employeeEvent.IsDeleted, false));

            var events = await _employeeEventsCollection
                .Find(filter)
                .SortByDescending(employeeEvent => employeeEvent.StartDate)
                .ToListAsync();

            var groupedEvents = events
                .GroupBy(employeeEvent => employeeEvent.EmployeeId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(MapToDto).ToList());

            var items = normalizedIds
                .Select(employeeId => new EmployeeEventBatchItemDto(
                    employeeId,
                    groupedEvents.TryGetValue(employeeId, out var employeeEvents)
                        ? employeeEvents
                        : new List<EmployeeEventDto>()))
                .ToList();

            return new EmployeeEventBatchResponseDto(items);
        }

        public async Task<EmployeeEventDto> CreateEmployeeEventAsync(
            string employeeId,
            EmployeeEventCreateDto dto)
        {
            ValidateObjectId(employeeId, nameof(employeeId));
            ValidateEvent(dto.EventType, dto.CustomEventType, dto.StartDate, dto.EndDate);
            await EnsureEmployeeExistsAsync(employeeId);

            var employeeEvent = new EmployeeEvent
            {
                EmployeeId = employeeId,
                EventType = dto.EventType.Trim(),
                CustomEventType = NormalizeCustomEventType(dto.EventType, dto.CustomEventType),
                Description = NormalizeDescription(dto.Description),
                StartDate = ToUtcDate(dto.StartDate),
                EndDate = dto.EndDate.HasValue ? ToUtcDate(dto.EndDate.Value) : null,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await _employeeEventsCollection.InsertOneAsync(employeeEvent);

            _logger.LogInformation(
                "Employee event created. EmployeeId: {EmployeeId}, EventId: {EventId}",
                employeeId,
                employeeEvent.Id);

            return MapToDto(employeeEvent);
        }

        public async Task<EmployeeEventDto> UpdateEmployeeEventAsync(
            string employeeId,
            string eventId,
            EmployeeEventUpdateDto dto)
        {
            ValidateObjectId(employeeId, nameof(employeeId));
            ValidateObjectId(eventId, nameof(eventId));
            ValidateEvent(dto.EventType, dto.CustomEventType, dto.StartDate, dto.EndDate);
            await EnsureEmployeeExistsAsync(employeeId);

            var now = DateTime.UtcNow;
            var filter = Builders<EmployeeEvent>.Filter.Where(employeeEvent =>
                employeeEvent.Id == eventId &&
                employeeEvent.EmployeeId == employeeId &&
                !employeeEvent.IsDeleted);
            var update = Builders<EmployeeEvent>.Update
                .Set(employeeEvent => employeeEvent.EventType, dto.EventType.Trim())
                .Set(employeeEvent => employeeEvent.CustomEventType, NormalizeCustomEventType(dto.EventType, dto.CustomEventType))
                .Set(employeeEvent => employeeEvent.Description, NormalizeDescription(dto.Description))
                .Set(employeeEvent => employeeEvent.StartDate, ToUtcDate(dto.StartDate))
                .Set(employeeEvent => employeeEvent.EndDate, dto.EndDate.HasValue ? ToUtcDate(dto.EndDate.Value) : null)
                .Set(employeeEvent => employeeEvent.UpdatedAt, now);

            var options = new FindOneAndUpdateOptions<EmployeeEvent>
            {
                ReturnDocument = ReturnDocument.After
            };
            var updatedEvent = await _employeeEventsCollection.FindOneAndUpdateAsync(filter, update, options);

            if (updatedEvent is null)
            {
                throw new KeyNotFoundException("Employee event was not found.");
            }

            _logger.LogInformation(
                "Employee event updated. EmployeeId: {EmployeeId}, EventId: {EventId}",
                employeeId,
                eventId);

            return MapToDto(updatedEvent);
        }

        public async Task<bool> SoftDeleteEmployeeEventAsync(string employeeId, string eventId)
        {
            ValidateObjectId(employeeId, nameof(employeeId));
            ValidateObjectId(eventId, nameof(eventId));
            await EnsureEmployeeExistsAsync(employeeId);

            var filter = Builders<EmployeeEvent>.Filter.Where(employeeEvent =>
                employeeEvent.Id == eventId &&
                employeeEvent.EmployeeId == employeeId &&
                !employeeEvent.IsDeleted);
            var update = Builders<EmployeeEvent>.Update
                .Set(employeeEvent => employeeEvent.IsDeleted, true)
                .Set(employeeEvent => employeeEvent.UpdatedAt, DateTime.UtcNow);
            var result = await _employeeEventsCollection.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException("Employee event was not found.");
            }

            _logger.LogInformation(
                "Employee event soft deleted. EmployeeId: {EmployeeId}, EventId: {EventId}",
                employeeId,
                eventId);

            return true;
        }

        private async Task EnsureEmployeeExistsAsync(string employeeId)
        {
            var employeeExists = await _employeesCollection
                .Find(employee => employee.Id == employeeId)
                .AnyAsync();

            if (!employeeExists)
            {
                throw new KeyNotFoundException("Employee was not found.");
            }
        }

        private static void ValidateObjectId(string value, string parameterName)
        {
            if (!ObjectId.TryParse(value, out _))
            {
                throw new ArgumentException($"{parameterName} must be a valid ObjectId.", parameterName);
            }
        }

        private static List<string> ValidateAndNormalizeBatchRequest(EmployeeEventBatchRequestDto? request)
        {
            if (request is null)
            {
                throw new ArgumentException("Request body is required.", nameof(request));
            }

            if (request.EmployeeIds is null)
            {
                throw new ArgumentException("EmployeeIds is required.", nameof(request.EmployeeIds));
            }

            var normalized = request.EmployeeIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (normalized.Count == 0)
            {
                return normalized;
            }

            foreach (var employeeId in normalized)
            {
                ValidateObjectId(employeeId, nameof(request.EmployeeIds));
            }

            return normalized;
        }

        private static void ValidateEvent(
            string? eventType,
            string? customEventType,
            DateOnly startDate,
            DateOnly? endDate)
        {
            if (string.IsNullOrWhiteSpace(eventType))
            {
                throw new ArgumentException("EventType is required.", nameof(eventType));
            }

            if (string.Equals(eventType.Trim(), "Other", StringComparison.Ordinal) &&
                string.IsNullOrWhiteSpace(customEventType))
            {
                throw new ArgumentException("CustomEventType is required when EventType is Other.", nameof(customEventType));
            }

            if (startDate == default)
            {
                throw new ArgumentException("StartDate is required.", nameof(startDate));
            }

            if (endDate.HasValue && endDate.Value < startDate)
            {
                throw new ArgumentException("EndDate cannot be earlier than StartDate.", nameof(endDate));
            }
        }

        private static string? NormalizeDescription(string? description)
        {
            var normalized = description?.Trim();
            return string.IsNullOrEmpty(normalized) ? null : normalized;
        }

        private static string? NormalizeCustomEventType(string eventType, string? customEventType)
        {
            if (!string.Equals(eventType.Trim(), "Other", StringComparison.Ordinal))
            {
                return null;
            }

            return customEventType!.Trim();
        }

        private static DateTime ToUtcDate(DateOnly value) =>
            DateTime.SpecifyKind(value.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        private static EmployeeEventDto MapToDto(EmployeeEvent employeeEvent) =>
            new(
                employeeEvent.Id ?? string.Empty,
                employeeEvent.EmployeeId,
                employeeEvent.EventType,
                employeeEvent.CustomEventType,
                employeeEvent.Description,
                DateOnly.FromDateTime(employeeEvent.StartDate),
                employeeEvent.EndDate.HasValue ? DateOnly.FromDateTime(employeeEvent.EndDate.Value) : null,
                employeeEvent.CreatedAt,
                employeeEvent.UpdatedAt);
    }
}