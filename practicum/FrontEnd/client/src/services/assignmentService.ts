import httpClient from "./api/httpClient";
import type {
  BulkAssignEmployeesDto,
  BulkAssignEmployeesResult,
  EmployeeAssignmentCandidate
} from "../types";

export const assignmentService = {
  // מחזירה רשימת מועמדים לשיבוץ עבור מערכת מסוימת.
  // אפשר להעביר שנה וחיפוש טקסטואלי כדי לסנן את התוצאות כבר בצד השרת.
  async getAssignmentCandidates(params: {
    systemId: string;
    year?: number;
    search?: string;
  }): Promise<EmployeeAssignmentCandidate[]> {
    const response = await httpClient.get<EmployeeAssignmentCandidate[]>(
      "/Employees/assignment-candidates",
      { params }
    );

    return response.data || [];
  },

  // מבצעת שיבוץ מרובה של עובדים למערכת בפעולה אחת.
  // הפונקציה שולחת DTO מרוכז ומחזירה תוצאה מפורטת מהשרת (הצלחות/כישלונות לפי החוזה).
  async bulkAssignEmployees(dto: BulkAssignEmployeesDto): Promise<BulkAssignEmployeesResult> {
    const response = await httpClient.post<BulkAssignEmployeesResult>(
      "/Employees/bulk-assign",
      dto
    );

    return response.data;
  }
};