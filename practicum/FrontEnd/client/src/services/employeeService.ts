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
  async getEmployees(filters: EmployeeFilters = {}): Promise<EmployeeListItem[]> {
    // חוזרים לנתיב המקורי ללא /api
    const response = await httpClient.get<ApiEmployee[]>("/Employees", {
      params: filters
    });
    return (response.data || []).map(normalizeEmployee);
  },

  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    const response = await httpClient.get<EmployeeDetails>(`/Employees/${id}`);
    return { ...response.data, allocations: response.data.allocations || [] };
  },

  async createEmployee(payload: EmployeeUpsertPayload): Promise<EmployeeListItem | null> {
    const response = await httpClient.post<ApiEmployee | null>("/Employees", payload);
    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  },

  async updateEmployee(id: string, payload: EmployeeUpsertPayload): Promise<EmployeeListItem | null> {
    const response = await httpClient.put<ApiEmployee | null>(`/Employees/${id}`, payload);
    if (!response.data) {
      return null;
    }

    return normalizeEmployee(response.data);
  },

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