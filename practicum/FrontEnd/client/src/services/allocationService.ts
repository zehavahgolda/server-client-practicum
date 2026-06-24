import httpClient from "./api/httpClient";

export interface AllocationUpsertPayload {
  systemId: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
}

export const allocationService = {
  async addAllocation(employeeId: string, payload: AllocationUpsertPayload): Promise<void> {
    await httpClient.post(`/Employees/${employeeId}/allocations`, payload);
  },

  async updateAllocationMonths(payload: {
    employeeId: string;
    systemId: string;
    roleInSystem: string;
    actualMonths: number;
  }): Promise<void> {
    const { employeeId, systemId, roleInSystem, actualMonths } = payload;

    // כאן ההדפסה שנוכל לראות ב-Console של הדפדפן
    console.log("--- DEBUG: Attempting to update allocation ---");
    console.log("Target URL:", `/Employees/${employeeId}/allocation-months`);
    console.log("Payload Params:", { systemId, roleInSystem, actualMonths });

    await httpClient.put(`/Employees/${employeeId}/allocation-months`, null, {
      params: { systemId, roleInSystem, actualMonths }
    });
  }
};