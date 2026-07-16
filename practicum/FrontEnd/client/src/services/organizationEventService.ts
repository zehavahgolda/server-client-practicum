import httpClient from "./api/httpClient";

import type {
  OrganizationEvent,
  OrganizationEventCreatePayload,
  OrganizationEventFilters,
  OrganizationEventUpdatePayload
} from "../types";

function normalizePayload(
  payload: OrganizationEventCreatePayload | OrganizationEventUpdatePayload
): OrganizationEventCreatePayload | OrganizationEventUpdatePayload {
  return {
    ...payload,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    endDate: payload.endDate || null,
    targetSystemIds: Array.from(new Set((payload.targetSystemIds || []).map((id) => id.trim()).filter(Boolean)))
  };
}

export const organizationEventService = {
  async getOrganizationEvents(filters: OrganizationEventFilters = {}): Promise<OrganizationEvent[]> {
    const response = await httpClient.get<OrganizationEvent[]>("/OrganizationEvents", {
      params: {
        search: filters.search,
        status: filters.status,
        scopeType: filters.scopeType,
        systemId: filters.systemId
      }
    });

    return response.data || [];
  },

  async createOrganizationEvent(payload: OrganizationEventCreatePayload): Promise<OrganizationEvent> {
    const response = await httpClient.post<OrganizationEvent>(
      "/OrganizationEvents",
      normalizePayload(payload)
    );

    return response.data;
  },

  async updateOrganizationEvent(id: string, payload: OrganizationEventUpdatePayload): Promise<OrganizationEvent> {
    const response = await httpClient.put<OrganizationEvent>(
      `/OrganizationEvents/${id}`,
      normalizePayload(payload)
    );

    return response.data;
  },

  async deleteOrganizationEvent(id: string): Promise<void> {
    await httpClient.delete(`/OrganizationEvents/${id}`);
  }
};