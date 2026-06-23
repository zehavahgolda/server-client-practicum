using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    /// <summary>
    /// חוזה השירות עבור פעולות על עובדים המשמש את ה-API Controllers.
    /// כולל פעולות קריאה וכתיבה הנדרשות על ידי ממשק המשתמש (יצירה/עדכון/הקצאה/מחיקה).
    /// </summary>
    public interface IEmployeeService
    {
        /// <summary>
        /// שליפת רשימת עובדים עם פילטרים אופציונליים לשימוש בממשק המשתמש.
        /// </summary>
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null);

        /// <summary>
        /// שליפת פרטים מלאים של עובד לפי מזהה.
        /// </summary>
        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

        /// <summary>
        /// עדכון שדה החודשים בפועל (ActualMonths) עבור הקצאה ספציפית של עובד.
        /// </summary>
        Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths);

        /// <summary>
        /// יצירת עובד חדש על בסיס ה-DTO שסופק והחזרת המזהה שלו.
        /// </summary>
        Task<string> CreateEmployeeAsync(EmployeeCreateDto dto);

        /// <summary>
        /// עדכון עובד קיים. תומך בעדכון חלקי. מחזיר אמת אם בוצע עדכון.
        /// </summary>
        Task<bool> UpdateEmployeeAsync(string id, EmployeeUpdateDto dto);

        /// <summary>
        /// הוספת הקצאה לעובד קיים (שיוך למערכת ותפקיד).
        /// מחזיר אמת אם ההקצאה נוספה בהצלחה.
        /// </summary>
        Task<bool> AddAllocationAsync(string employeeId, AllocationCreateDto dto);

        /// <summary>
        /// מחיקה רכה (Soft-delete) של עובד לפי מזהה (קביעת IsActive = false).
        /// מחזיר אמת אם העובד עודכן.
        /// </summary>
        Task<bool> DeleteEmployeeAsync(string id);
    }
}