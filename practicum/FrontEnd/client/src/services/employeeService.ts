import httpClient from "./api/httpClient";
import type { EmployeeDetails, EmployeeFilters, EmployeeListItem, EmployeeUpsertPayload } from "../types";

type ApiEmployee = Partial<EmployeeListItem> & {
  id?: string;
  _id?: string;
  name?: string;
  departmentId?: string;
  totalActualMonths?: number;
  allocations?: unknown[];
  year?: number;
};

// מנרמלת אובייקט עובד שמגיע מה-API למבנה אחיד שה-UI מצפה לו.
// הפונקציה משלימה שדות חסרים (למשל מזהה, שם, סטטוס וזמינות) עם ערכי ברירת מחדל.
function normalizeEmployee(item: ApiEmployee): EmployeeListItem {
  const id = item.id || item._id || "";
  const allocatedMonths = item.allocatedMonths ?? item.totalActualMonths ?? 0;
  const yearlyCapacityMonths = item.yearlyCapacityMonths ?? 12;
  const remainingMonths = item.remainingMonths ?? yearlyCapacityMonths - allocatedMonths;
  const fullName = item.fullName?.trim() || item.name?.trim() || `עובד ${id.slice(-4)}`;
  const professionalCategory = item.professionalCategory?.trim() || item.departmentId?.trim() || "לא מוגדר";

  return {
    id,
    fullName,
    professionalCategory,
    managerName: item.managerName?.trim() || "לא מוגדר",
    year: item.year ?? 0,
    yearlyCapacityMonths,
    allocatedMonths,
    remainingMonths,
    availabilityStatus: item.availabilityStatus || (remainingMonths < 0 ? "Overloaded" : remainingMonths <= 1 ? "AtRisk" : "Balanced"),
    assignedSystemsCount: item.assignedSystemsCount ?? item.allocations?.length ?? 0
  };
}

export const employeeService = {
  // מחזירה רשימת עובדים לפי פילטרים אופציונליים.
  // לאחר השליפה, כל עובד עובר נרמול כדי להבטיח מבנה נתונים עקבי בכל המסכים.
  async getEmployees(filters: EmployeeFilters = {}): Promise<EmployeeListItem[]> {
    // חוזרים לנתיב המקורי ללא /api
    const response = await httpClient.get<ApiEmployee[]>("/Employees", {
      params: filters
    });
    return (response.data || []).map(normalizeEmployee);
  },

  // מחזירה פרטי עובד מלאים לפי מזהה עובד.
  // מבוצע נרמול לשדה ההקצאות כדי לוודא שתמיד מתקבל מערך תקין.
  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    const response = await httpClient.get<EmployeeDetails>(`/Employees/${id}`);
    return { ...response.data, allocations: response.data.allocations || [] };
  },

  // יוצרת עובד חדש בשרת ומחזירה אותו לאחר נרמול למבנה אחיד בקליינט.
  // אם השרת מחזיר גוף ריק, מוחזר null כדי שהשכבה הקוראת תטפל בהתאם.
  async createEmployee(payload: EmployeeUpsertPayload): Promise<EmployeeListItem | null> {
    const response = await httpClient.post<ApiEmployee | null>("/Employees", payload);
    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  },

  // מעדכנת עובד קיים לפי מזהה ומחזירה את הנתון המעודכן לאחר נרמול.
  // גם כאן null מציין תגובה ריקה מהשרת ודורש טיפול בצד המשתמש בפונקציה.
  async updateEmployee(id: string, payload: EmployeeUpsertPayload): Promise<EmployeeListItem | null> {
    const response = await httpClient.put<ApiEmployee | null>(`/Employees/${id}`, payload);
    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  },

  // מעדכנת את חודשי הביצוע של הקצאה לעובד ספציפי במערכת ספציפית.
  // הפרמטרים נשלחים כ-query params בהתאם לחוזה ה-API, עם גוף בקשה ריק.
  async updateAllocationMonths(payload: {
    employeeId: string;
    systemId: string;
    roleInSystem: string;
    actualMonths: number;
  }): Promise<void> {
    const { employeeId, systemId, roleInSystem, actualMonths } = payload;
    // נשתמש בנתיב המלא כפי שמופיע ב-Swagger, אבל בלי /api הפעם
    await httpClient.put(`/Employees/${employeeId}/allocation-months`, null, {
      params: { systemId, roleInSystem, actualMonths }
    });
  }
};