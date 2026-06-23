namespace HR_System.DTOs.Employees
{
    /// <summary>
    /// DTO for displaying employee in list view.
    /// Contains basic employee information and aggregated allocation data.
    /// </summary>
    public record EmployeeListItemDto(
        string Id,//מזהה עובד
        string FullName,//שם מלא
        string ProfessionalCategory,//קטגוריה מקצועית
        string? ProfessionalSubCategory, //תת תחום 
        string ManagerName,//שם מנהל
        int Year,//שנה
        int YearlyCapacityMonths,//קיבולת שנתית בחודשים
        int AllocatedMonths,//חודשים מוקצים
        int RemainingMonths,//יתרת חודשים, חודשים פנויים 
        string AvailabilityStatus,// סטטוס זמינות
        int AssignedSystemsCount,//כמות מערכות
        string? UpcomingEvent//אירוע עתידי
    );
}
