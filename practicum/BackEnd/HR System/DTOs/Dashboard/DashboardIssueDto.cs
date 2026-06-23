public record DashboardIssueDto(
    string SystemId, // מזהה מערכת
    string SystemName, // שם מערכת
    int RequiredMonths, // נדרש
    int AllocatedMonths, // מוקצה
    int Gap // פער
);
