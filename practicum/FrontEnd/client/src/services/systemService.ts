import httpClient from "./api/httpClient";
import type { System, SystemDetails, SystemFilters, SystemCreateDto, SystemUpdateDto } from "../types";

function normalizeSystem(item: System): System {
  return {
    ...item,
    name: item.name?.trim() || "ללא שם",
    capacityStatus: item.capacityStatus?.trim() || "לא מוגדר"
  };
}

function normalizeSystemDetails(item: SystemDetails): SystemDetails {
  return {
    ...normalizeSystem(item),
    assignedEmployees: item.assignedEmployees || [],
    changes: item.changes || [],
    totalBudget: item.totalBudget || 0,
    totalPlannedMonths: item.totalPlannedMonths || 0,
    totalActualMonths: item.totalActualMonths || 0,
    variancePercent: item.variancePercent || 0
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

  return normalizeSystemDetails(response.data);
},
  async exportToExcel(year?: number, status?: string): Promise<Blob> {
    const response = await httpClient.get("/System/export", {
      params: { year, status },
      responseType: "blob"
    });
    return response.data;
  },
  async createSystem(dto: SystemCreateDto): Promise<string> {
  const response = await httpClient.post<string>("/System", dto);
  return response.data;
},
  async updateSystem(id: string, dto: SystemUpdateDto): Promise<SystemDetails> {
    const response = await httpClient.put<SystemDetails>(`/System/${id}`, dto);
    return normalizeSystemDetails(response.data);
}
};
