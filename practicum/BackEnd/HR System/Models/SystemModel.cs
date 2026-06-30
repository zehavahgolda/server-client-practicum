using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    [BsonIgnoreExtraElements] // מתעלם מכל שדה במסד שלא הגדרנו כאן במפורש
    public class SystemModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; } // מזהה מערכת

        [BsonElement("name")]
        public string Name { get; set; } = null!; // שם מערכת

        [BsonElement("ownerManagerName")]
        public string? OwnerManagerName { get; set; } // מנהל אחראי על מערכת

        [BsonElement("year")]
        public int Year { get; set; } // שנה

        [BsonElement("requiredCapacity")]
        public int RequiredCapacityMonths { get; set; } // חודשי עבודה מוקצים למערכת

        [BsonElement("managementNote")]
        public string? ManagementNote { get; set; } // הערה ניהולית על המערכת

        [BsonElement("isProject")]
        public bool IsProject { get; set; } // האם מדובר בפרויקט

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true; // סטטוס פעילות

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("allocatedBudget")]//תקציב מהמערכת של התקציב
        public decimal AllocatedBudget { get; set; }
    }
}