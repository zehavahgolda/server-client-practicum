import httpClient from "./api/httpClient";
import type { System, SystemDetails, SystemFilters } from "../types";

function normalizeSystem(item: System): System {
  return {
    ...item,
    name: item.name?.trim() || "ללא שם",
    capacityStatus: item.capacityStatus?.trim() || "לא מוגדר"
  };
}

export const systemService = {
  async getSystems(filters: SystemFilters = {}): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System", {
      params: filters
    });
    console.log("🏗️ Systems API Response:", { filters, responseCount: response.data?.length, data: response.data });
    return (response.data || []).map(normalizeSystem);
  },

  async getSystemsWithShortage(): Promise<System[]> {
    const response = await httpClient.get<System[]>("/System/shortage");
    return (response.data || []).map(normalizeSystem);
  },

  async getSystemById(id: string): Promise<SystemDetails> {
    const response = await httpClient.get<SystemDetails>(`/System/${id}`);
    return {
      ...response.data,
      assignedEmployees: response.data.assignedEmployees || [],
      changes: response.data.changes || [],
      budget: response.data.budget || {
        totalBudget: 0,
        totalPlannedMonths: 0,
        totalActualMonths: 0,
        variancePercent: 0
      }
    };
  },

  async exportToExcel(year?: number, status?: string): Promise<Blob> {
    const response = await httpClient.get("/System/export", {
      params: { year, status },
      responseType: "blob"
    });
    return response.data;
  }
};
