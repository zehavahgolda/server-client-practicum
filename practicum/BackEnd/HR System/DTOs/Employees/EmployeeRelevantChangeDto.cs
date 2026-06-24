using System.Collections.Generic;

namespace HR_System.DTOs.Employees
{
    public record EmployeeRelevantChangeDto
    {
        public string Title { get; init; } = null!; // כותרת שינוי
        public int? Date { get; init; } // תאריך
        public string? Description { get; init; } // פירוט קצר
    }
}