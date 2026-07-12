public record DashboardIssueDto(
    string SystemId, // מזהה מערכת
    string SystemName, // שם מערכת
    double RequiredMonths, // נדרש
    double AllocatedMonths, // מוקצה
    double Gap // פער
);
