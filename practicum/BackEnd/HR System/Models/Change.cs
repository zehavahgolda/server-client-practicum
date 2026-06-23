using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    public class Change
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("systemId")]
        public string SystemId { get; set; } = null!;

        [BsonElement("changedBy")]
        public string ChangedBy { get; set; } = null!;

        [BsonElement("changeDate")]
        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;

        [BsonElement("description")]
        public string Description { get; set; } = null!;
    }
}