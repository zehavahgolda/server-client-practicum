using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    [BsonIgnoreExtraElements] // מורה ל-MongoDB להתעלם משדות במסד שאינם מוגדרים במחלקה זו
    public class Employee
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; } // מזהה עובד

        [BsonElement("fullName")]
        public string FullName { get; set; } = null!; // שם עובד

        [BsonElement("professionalCategory")]
        public string ProfessionalCategory { get; set; } = null!; // קטגוריה מקצועית

        [BsonElement("professionalSubCategory")]
        public string? ProfessionalSubCategory { get; set; } // Backend, Frontend..

        [BsonElement("managerName")]
        public string ManagerName { get; set; } = null!; // שם מנהל

        [BsonElement("year")]
        public int Year { get; set; } // שנה

        [BsonElement("yearlyCapacityMonths")]
        public int YearlyCapacityMonths { get; set; } = 12; // חודשים מוקצים לשנה

        [BsonElement("upcomingEvent")]
        public string? UpcomingEvent { get; set; } // ארוע מגיע

        [BsonElement("notes")]
        public string? Notes { get; set; } // הערות

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true; // פעיל

        [BsonElement("allocations")]
        public List<EmployeeAllocation> Allocations { get; set; } = new(); // הקצאות
    }

    [BsonIgnoreExtraElements] // הוסף את זה כאן
    public class EmployeeAllocation
    {
        [BsonElement("systemId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SystemId { get; set; } = null!;

        [BsonElement("roleInSystem")]
        public string RoleInSystem { get; set; } = null!;

        [BsonElement("plannedMonths")]
        public int PlannedMonths { get; set; }

        [BsonElement("actualMonths")]
        public int ActualMonths { get; set; }

    }
}