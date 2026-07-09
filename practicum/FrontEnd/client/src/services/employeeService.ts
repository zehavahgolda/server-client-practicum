import httpClient from "./api/httpClient";
import type { EmployeeDetails, EmployeeFilters, EmployeeListItem, EmployeeUpsertPayload } from "../types";
import { normalizeMonthValue } from "../utils/months";

// ממיר ערך חודשים למחרוזת query בפורמט עשרוני סטנדרטי ל-API.
function toMonthQueryParam(value: number): string {
  const normalizedValue = normalizeMonthValue(value);
  return String(normalizedValue);
}

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
  const allocatedMonths = normalizeMonthValue(item.allocatedMonths ?? item.totalActualMonths ?? 0, {
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY
  });
  const yearlyCapacityMonths = normalizeMonthValue(item.yearlyCapacityMonths ?? 12, { min: 0, max: 12 });
  const remainingMonths = normalizeMonthValue(
    item.remainingMonths ?? yearlyCapacityMonths - allocatedMonths,
    {
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY
    }
  );
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
    return {
      ...response.data,
      yearlyCapacityMonths: normalizeMonthValue(response.data.yearlyCapacityMonths, { min: 0, max: 12 }),
      allocatedMonths: normalizeMonthValue(response.data.allocatedMonths, {
        min: Number.NEGATIVE_INFINITY,
        max: Number.POSITIVE_INFINITY
      }),
      remainingMonths: normalizeMonthValue(response.data.remainingMonths, {
        min: Number.NEGATIVE_INFINITY,
        max: Number.POSITIVE_INFINITY
      }),
      allocations: (response.data.allocations || []).map((allocation) => ({
        ...allocation,
        plannedMonths: normalizeMonthValue(allocation.plannedMonths, { min: 0, max: 12 }),
        actualMonths: normalizeMonthValue(allocation.actualMonths, { min: 0, max: 12 })
      }))
    };
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
      params: {
        systemId,
        roleInSystem,
        actualMonths: toMonthQueryParam(actualMonths)
      }
    });
  }
};