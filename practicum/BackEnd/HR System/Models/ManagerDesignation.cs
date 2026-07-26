using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    [BsonIgnoreExtraElements]
    public class ManagerDesignation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("employeeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string EmployeeId { get; set; } = null!;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("deactivatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? DeactivatedAt { get; set; }

        [BsonElement("deactivationReason")]
        public string? DeactivationReason { get; set; }
    }
}
