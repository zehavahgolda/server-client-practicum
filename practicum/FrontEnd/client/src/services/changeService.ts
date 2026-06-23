import httpClient from "./api/httpClient";
import type { Change, Timeline, ChangeFilters } from "../types";

export const changeService = {
  async getChanges(filters: ChangeFilters = {}): Promise<Change[]> {
    const response = await httpClient.get<Change[]>("/Change", {
      params: filters
    });
    return response.data || [];
  },

  async getTimeline(year?: number): Promise<Timeline[]> {
    const response = await httpClient.get<Timeline[]>("/Change/timeline", {
      params: { year }
    });
    return response.data || [];
  },

  async getChangesByEntity(entityId: string): Promise<Change[]> {
    const response = await httpClient.get<Change[]>(`/Change/entity/${entityId}`);
    return response.data || [];
  }
};
