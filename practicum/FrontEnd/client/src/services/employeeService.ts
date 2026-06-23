import httpClient from "./api/httpClient";
import type { EmployeeDetails, EmployeeFilters, EmployeeListItem } from "../types";

type ApiEmployee = Partial<EmployeeListItem> & {
  id?: string;
  _id?: string;
  name?: string;
  departmentId?: string;
  totalActualMonths?: number;
  allocations?: unknown[];
};

// The backend currently returns mixed schemas for employees (legacy + new).
// This normalizer supports both so the list view remains stable.
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
    const response = await httpClient.get<ApiEmployee[]>("/Employees", {
      params: filters
    });

    const primary = (response.data || []).map(normalizeEmployee);
    if (primary.length > 0 || filters.year == null) {
      return primary;
    }

    // Backend data can be stored without year. If year-filtered query is empty,
    // fallback to an unfiltered query so employees still load.
    const { year, ...restFilters } = filters;
    const fallbackResponse = await httpClient.get<ApiEmployee[]>("/Employees", {
      params: restFilters
    });
    return (fallbackResponse.data || []).map(normalizeEmployee);
  },

  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    const response = await httpClient.get<EmployeeDetails>(`/Employees/${id}`);
    return {
      ...response.data,
      allocations: response.data.allocations || [],
      relevantChanges: response.data.relevantChanges || []
    };
  },

  async updateAllocationMonths(payload: {
    employeeId: string;
    systemId: string;
    roleInSystem: string;
    actualMonths: number;
  }): Promise<void> {
    const { employeeId, systemId, roleInSystem, actualMonths } = payload;

    await httpClient.put(`/Employees/${employeeId}/allocation-months`, null, {
      params: { systemId, roleInSystem, actualMonths }
    });
  }
};
