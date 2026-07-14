using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    [BsonIgnoreExtraElements]
    public class EmployeeEvent
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("employeeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string EmployeeId { get; set; } = null!;

        [BsonElement("eventType")]
        public string EventType { get; set; } = null!;

        [BsonElement("customEventType")]
        public string? CustomEventType { get; set; }

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("startDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime StartDate { get; set; }

        [BsonElement("endDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? EndDate { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("isDeleted")]
        public bool IsDeleted { get; set; }
    }
}