namespace HR_System.DTOs.Dashboard
{
    public record DashboardSummaryDto(
        int Year, //שנת תכנון
        int TotalEmployees,//סהכ עובדים
        int TotalSystems,//סהכ מערכות 
        int OverallHealthPercent, // מצב כללי
        int CapacityUtilizationPercent, // ניצול קיבולת
        int ShortageSystemsCount,//מערכות במחסור
        int BalancedSystemsCount,//מערכות מאוזנות
        int ExcessSystemsCount,//מערכות בעודף
        int TotalRequiredMonths,//חודשים נדרשים
        int TotalAllocatedMonths,//חודשים  מוקצים
        int TotalGap,//הפער הכולל
        int AvailableEmployeesCount,//עובדים פנויים 
        int BalancedEmployeesCount,//עובדים מאוזנים
        int OverloadedEmployeesCount,//עובדים עמוסים  
        List<DashboardIssueDto> DecisionIssues, // בעיות החלטה
        List<DashboardCategoryDto> EmployeesByCategory, // עובדים לפי תחום
        List<DashboardSystemDemandDto> SystemDemand // ביקוש לפי מערכת
    );



}
