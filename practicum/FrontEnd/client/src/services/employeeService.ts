import httpClient from "./api/httpClient";

import type {
  EmployeeDetails,
  EmployeeFilters,
  EmployeeListItem,
  EmployeeUpsertPayload
} from "../types";

import { normalizeMonthValue } from "../utils/months";

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
// הפונקציה משלימה שדות חסרים עם ערכי ברירת מחדל.
function normalizeEmployee(item: ApiEmployee): EmployeeListItem {
  const id = item.id || item._id || "";

  const allocatedMonths = normalizeMonthValue(
    item.allocatedMonths ?? item.totalActualMonths ?? 0,
    {
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY
    }
  );

  const yearlyCapacityMonths = normalizeMonthValue(
    item.yearlyCapacityMonths ?? 12,
    {
      min: 0,
      max: 12
    }
  );

  const remainingMonths = normalizeMonthValue(
    item.remainingMonths ?? yearlyCapacityMonths - allocatedMonths,
    {
      min: Number.NEGATIVE_INFINITY,
      max: Number.POSITIVE_INFINITY
    }
  );

  const fullName =
    item.fullName?.trim() ||
    item.name?.trim() ||
    `עובד ${id.slice(-4)}`;

  const professionalCategory =
    item.professionalCategory?.trim() ||
    item.departmentId?.trim() ||
    "לא מוגדר";

  return {
    id,
    fullName,
    professionalCategory,
    managerName: item.managerName?.trim() || "לא מוגדר",
    year: item.year ?? 0,
    yearlyCapacityMonths,
    allocatedMonths,
    remainingMonths,
    availabilityStatus:
      item.availabilityStatus ||
      (remainingMonths < 0
        ? "Overloaded"
        : remainingMonths <= 1
          ? "AtRisk"
          : "Balanced"),
    assignedSystemsCount:
      item.assignedSystemsCount ?? item.allocations?.length ?? 0,
    isActive: item.isActive ?? true
  };
}

export const employeeService = {
  // מחזירה רשימת עובדים לפי פילטרים אופציונליים.
  // לאחר השליפה, כל עובד עובר נרמול למבנה אחיד.
  async getEmployees(
    filters: EmployeeFilters = {}
  ): Promise<EmployeeListItem[]> {
    const response = await httpClient.get<ApiEmployee[]>("/Employees", {
      params: filters
    });

    return (response.data || []).map(normalizeEmployee);
  },

  // מחזירה פרטי עובד מלאים לפי מזהה.
  // מנרמלת את שדות החודשים ואת מערך ההקצאות.
  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    const response = await httpClient.get<EmployeeDetails>(
      `/Employees/${id}`
    );

    return {
      ...response.data,
      yearlyCapacityMonths: normalizeMonthValue(
        response.data.yearlyCapacityMonths,
        {
          min: 0,
          max: 12
        }
      ),
      allocatedMonths: normalizeMonthValue(
        response.data.allocatedMonths,
        {
          min: Number.NEGATIVE_INFINITY,
          max: Number.POSITIVE_INFINITY
        }
      ),
      remainingMonths: normalizeMonthValue(
        response.data.remainingMonths,
        {
          min: Number.NEGATIVE_INFINITY,
          max: Number.POSITIVE_INFINITY
        }
      ),
      allocations: (response.data.allocations || []).map((allocation) => ({
        ...allocation,
        plannedMonths: normalizeMonthValue(
          allocation.plannedMonths,
          {
            min: 0,
            max: 12
          }
        ),
        actualMonths: normalizeMonthValue(
          allocation.actualMonths,
          {
            min: 0,
            max: 12
          }
        )
      }))
    };
  },

  // יוצרת עובד חדש ומחזירה אותו לאחר נרמול.
  // אם השרת מחזיר גוף ריק, מוחזר null.
  async createEmployee(
    payload: EmployeeUpsertPayload
  ): Promise<EmployeeListItem | null> {
    const response = await httpClient.post<ApiEmployee | null>(
      "/Employees",
      payload
    );

    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  },

  // מעדכנת עובד קיים ומחזירה אותו לאחר נרמול.
  // אם השרת מחזיר גוף ריק, מוחזר null.
  async updateEmployee(
    id: string,
    payload: EmployeeUpsertPayload
  ): Promise<EmployeeListItem | null> {
    const response = await httpClient.put<ApiEmployee | null>(
      `/Employees/${id}`,
      payload
    );

    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  }
};