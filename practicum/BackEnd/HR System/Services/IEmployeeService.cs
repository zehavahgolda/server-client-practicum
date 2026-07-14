using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    /// <summary>
    /// חוזה השירות עבור פעולות על עובדים המשמש את ה-API Controllers.
    /// כולל פעולות קריאה וכתיבה הנדרשות על ידי ממשק המשתמש.
    /// </summary>
    public interface IEmployeeService
    {
        /// <summary>
        /// שליפת רשימת עובדים עם פילטרים אופציונליים.
        ///
        /// isActive:
        /// true  - עובדים פעילים בלבד.
        /// false - עובדים לא פעילים בלבד.
        /// null  - כל העובדים.
        /// </summary>
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null,
            bool? isActive = null);

        /// <summary>
        /// שליפת מועמדים לשיבוץ למערכת מסוימת.
        /// </summary>
        Task<List<EmployeeAssignmentCandidateDto>> GetAssignmentCandidatesAsync(
            string systemId,
            int? year = null,
            string? search = null);

        /// <summary>
        /// שליפת פרטים מלאים של עובד לפי מזהה.
        /// </summary>
        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

        /// <summary>
        /// עדכון שדה החודשים בפועל עבור הקצאה ספציפית של עובד.
        /// </summary>
        Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths);

        /// <summary>
        /// יצירת עובד חדש והחזרת המזהה שלו.
        /// </summary>
        Task<string> CreateEmployeeAsync(EmployeeCreateDto dto);

        /// <summary>
        /// עדכון עובד קיים.
        /// </summary>
        Task<bool> UpdateEmployeeAsync(
            string id,
            EmployeeEditDto dto);

        /// <summary>
        /// הוספת הקצאה לעובד קיים.
        /// </summary>
        Task<bool> AddAllocationAsync(
            string employeeId,
            AllocationCreateDto dto);

        /// <summary>
        /// שיבוץ כמה עובדים למערכת בפעולה אחת.
        /// </summary>
        Task<BulkAssignEmployeesResultDto>
            BulkAssignEmployeesToSystemAsync(
                BulkAssignEmployeesDto dto);

        /// <summary>
        /// מחיקה רכה של עובד.
        /// </summary>
        Task<bool> DeleteEmployeeAsync(string id);
    }
}