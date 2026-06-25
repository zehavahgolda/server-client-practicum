//using HR_System.DTOs.Employees;

//namespace HR_System.Services
//{
//    /// חוזה השירות עבור פעולות על עובדים המשמש את ה-API Controllers.
//    /// כולל פעולות קריאה וכתיבה הנדרשות על ידי ממשק המשתמש (יצירה/עדכון/הקצאה/מחיקה).
//    public interface IEmployeeService
//    {
//        /// שליפת רשימת עובדים עם פילטרים אופציונליים לשימוש בממשק המשתמש.
//        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
//            int? year = null,
//            string? managerName = null,
//            string? professionalCategory = null,
//            string? systemId = null,
//            string? search = null);

//        /// שליפת פרטים מלאים של עובד לפי מזהה.
//        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

//        /// עדכון שדה החודשים בפועל (ActualMonths) עבור הקצאה ספציפית של עובד.
//        Task<bool> UpdateAllocationActualMonthsAsync(
//            string employeeId,
//            string systemId,
//            string roleInSystem,
//            int actualMonths);

//        /// יצירת עובד חדש על בסיס ה-DTO שסופק והחזרת המזהה שלו.
//        Task<string> CreateEmployeeAsync(EmployeeCreateDto dto);

//        /// עדכון עובד קיים. תומך בעדכון חלקי. מחזיר אמת אם בוצע עדכון.
//        Task<bool> UpdateEmployeeAsync(string id, EmployeeEditDto dto);

//        /// הוספת הקצאה לעובד קיים (שיוך למערכת ותפקיד).
//        /// מחזיר אמת אם ההקצאה נוספה בהצלחה.
//        Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto);

//        /// מחיקה רכה (Soft-delete) של עובד לפי מזהה (קביעת IsActive = false).
//        /// מחזיר אמת אם העובד עודכן.
//        Task<bool> DeleteEmployeeAsync(string id);

//        Task<List<EmployeeAssignmentCandidateDto>> GetAssignmentCandidatesAsync(string systemId,int? year = null,string? search = null);

//        Task<BulkAssignEmployeesResultDto> BulkAssignEmployeesToSystemAsync(BulkAssignEmployeesDto dto);

//    }
//}
using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    /// חוזה השירות עבור פעולות על עובדים המשמש את ה-API Controllers.
    /// כולל פעולות קריאה וכתיבה הנדרשות על ידי ממשק המשתמש (יצירה/עדכון/הקצאה/מחיקה).
    public interface IEmployeeService
    {
        /// שליפת רשימת עובדים עם פילטרים אופציונליים לשימוש בממשק המשתמש.
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null);

        /// שליפת מועמדים לשיבוץ למערכת מסוימת.
        Task<List<EmployeeAssignmentCandidateDto>> GetAssignmentCandidatesAsync(
            string systemId,
            int? year = null,
            string? search = null);

        /// שליפת פרטים מלאים של עובד לפי מזהה.
        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

        /// עדכון שדה החודשים בפועל עבור הקצאה ספציפית של עובד.
        Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths);

        /// יצירת עובד חדש על בסיס ה-DTO שסופק והחזרת המזהה שלו.
        Task<string> CreateEmployeeAsync(EmployeeCreateDto dto);

        /// עדכון עובד קיים. תומך בעדכון חלקי. מחזיר אמת אם בוצע עדכון.
        Task<bool> UpdateEmployeeAsync(string id, EmployeeEditDto dto);

        /// הוספת הקצאה לעובד קיים.
        Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto);

        /// שיבוץ כמה עובדים למערכת בפעולה אחת.
        Task<BulkAssignEmployeesResultDto> BulkAssignEmployeesToSystemAsync(BulkAssignEmployeesDto dto);

        /// מחיקה רכה של עובד.
        Task<bool> DeleteEmployeeAsync(string id);
    }
}