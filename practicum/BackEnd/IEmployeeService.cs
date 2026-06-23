using HR_System.DTOs.Employees;

namespace HR_System.Services
{
    public interface IEmployeeService
    {
        /// <summary>
        /// שליפת רשימת עובדים מסוננת לפי שנה, מנהל, קטגוריה מקצועית, מערכת וחיפוש
        /// </summary>
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            int? year = null,
            string? managerName = null,
            string? professionalCategory = null,
            string? systemId = null,
            string? search = null);

        /// <summary>
        /// שליפת פרטי עובד ספציפי כולל הקצאות למערכות
        /// </summary>
        Task<EmployeeDetailsDto?> GetEmployeeByIdAsync(string id);

        /// <summary>
        /// עדכון חודשים בפועל להקצאה ספציפית של עובד לתפקיד במערכת
        /// </summary>
        Task<bool> UpdateAllocationActualMonthsAsync(
            string employeeId,
            string systemId,
            string roleInSystem,
            int actualMonths);
    }
}