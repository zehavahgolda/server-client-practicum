using System.Collections.Generic;
namespace HR_System.DTOs.Employees
{
    public record EmployeeListItemDto(
        string Id, // מזהה עובד
        string FullName, // שם מלא
        string ProfessionalCategory, // קטגוריה מקצועית
        string? ProfessionalSubCategory, // תת תחום 
        string ManagerName, // שם מנהל
        int YearlyCapacityMonths, // קיבולת שנתית בחודשים
        int AllocatedMonths, // חודשים מוקצים
        int RemainingMonths, // יתרת חודשים, חודשים פנויים 
        string AvailabilityStatus, // סטטוס זמינות
        int AssignedSystemsCount // כמות מערכות
    );
}
