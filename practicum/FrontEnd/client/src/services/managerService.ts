import httpClient from "./api/httpClient";
import type {
  ManagerCandidate,
  ManagerCreatePayload,
  ManagerDeactivateResult,
  ManagerListItem,
  ManagerMutationResult,
  ManagerStatusFilter
} from "../types";

export const managerService = {
  async getManagers(params: { status?: ManagerStatusFilter; search?: string } = {}): Promise<ManagerListItem[]> {
    const response = await httpClient.get<ManagerListItem[]>("/Managers", {
      params: {
        status: params.status,
        search: params.search
      }
    });

    return response.data || [];
  },

  async getCandidates(params: { search?: string } = {}): Promise<ManagerCandidate[]> {
    const response = await httpClient.get<ManagerCandidate[]>("/Managers/candidates", {
      params: {
        search: params.search
      }
    });

    return response.data || [];
  },

  async addManager(payload: ManagerCreatePayload): Promise<ManagerMutationResult> {
    const response = await httpClient.post<ManagerMutationResult>("/Managers", payload);
    return response.data;
  },

  async deactivateManager(designationId: string, deactivationReason?: string): Promise<ManagerDeactivateResult> {
    const response = await httpClient.put<ManagerDeactivateResult>(
      `/Managers/${designationId}/deactivate`,
      {
        deactivationReason: deactivationReason?.trim() || undefined
      }
    );

    return response.data;
  },

  async reactivateManager(designationId: string): Promise<ManagerMutationResult> {
    const response = await httpClient.put<ManagerMutationResult>(
      `/Managers/${designationId}/reactivate`
    );

    return response.data;
  }
};
