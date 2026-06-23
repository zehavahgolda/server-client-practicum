namespace HR_System.DTOs.Systems
{
    public record SystemListItemDto(
        string Id,  //מזהה
        string Name,//שם מערכת
        int Year,//שנה
        int RequiredCapacityMonths,//חודשי עבודה נדרשים למערכת
        int AllocatedMonths,//חודשי עבודה מוקצים למערכת
        int Gap,//פער
        string CapacityStatus,
        int AssignedEmployeesCount,//עובדים
        string? ManagementNote//תובנות
    );
}
