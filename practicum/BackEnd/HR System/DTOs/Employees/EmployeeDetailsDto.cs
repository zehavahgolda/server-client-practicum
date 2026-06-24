using System.Collections.Generic;

    namespace HR_System.DTOs.Employees
    {
        public record EmployeeDetailsDto(
            string Id,
            string FullName,
            string ManagerName,
            string ProfessionalCategory,
            string? ProfessionalSubCategory,
            int Year,
            int YearlyCapacityMonths, // קיבולת שנתית לעובד
            string? UpcomingEvent, // אירוע עתידי
            int AllocatedMonths, // חודשים מוקצים
            int RemainingMonths, // יתרת חודשים, חודשים פנויים
            string AvailabilityStatus, // סטטוס זמינות 
            int AssignedSystemsCount, // מספר המערכות המשויכות אליו   
            string? Notes,
            string? ManagerReviewNote,
            List<EmployeeRelevantChangeDto> RelevantChanges,
            List<EmployeeAllocationDto> Allocations // רשימת המערכות של העובד
        );
    }
