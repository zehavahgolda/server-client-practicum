import httpClient from "./api/httpClient";
import type {
  EmployeeEvent,
  EmployeeEventBatchItem,
  EmployeeEventBatchResponse,
  EmployeeEventCreatePayload,
  EmployeeEventUpdatePayload
} from "../types";

function normalizeCustomEventType(
  eventType: string,
  customEventType?: string | null
) {
  if (eventType !== "Other") {
    return null;
  }

  const normalized = customEventType?.trim();
  return normalized ? normalized : null;
}

function normalizePayload(
  payload: EmployeeEventCreatePayload | EmployeeEventUpdatePayload
): EmployeeEventCreatePayload | EmployeeEventUpdatePayload {
  return {
    ...payload,
    eventType: payload.eventType.trim(),
    customEventType: normalizeCustomEventType(
      payload.eventType,
      payload.customEventType
    ),
    description: payload.description?.trim() || null,
    endDate: payload.endDate || null
  };
}

export const employeeEventService = {
  async getEmployeeEvents(employeeId: string): Promise<EmployeeEvent[]> {
    const response = await httpClient.get<EmployeeEvent[]>(
      `/Employees/${encodeURIComponent(employeeId)}/events`
    );

    return response.data || [];
  },

  async createEmployeeEvent(
    employeeId: string,
    payload: EmployeeEventCreatePayload
  ): Promise<EmployeeEvent> {
    const response = await httpClient.post<EmployeeEvent>(
      `/Employees/${encodeURIComponent(employeeId)}/events`,
      normalizePayload(payload)
    );

    return response.data;
  },

  async updateEmployeeEvent(
    employeeId: string,
    eventId: string,
    payload: EmployeeEventUpdatePayload
  ): Promise<EmployeeEvent> {
    const response = await httpClient.put<EmployeeEvent>(
      `/Employees/${encodeURIComponent(employeeId)}/events/${encodeURIComponent(eventId)}`,
      normalizePayload(payload)
    );

    return response.data;
  },

  async deleteEmployeeEvent(employeeId: string, eventId: string): Promise<void> {
    await httpClient.delete(
      `/Employees/${encodeURIComponent(employeeId)}/events/${encodeURIComponent(eventId)}`
    );
  },

  async getEmployeeEventsBatch(employeeIds: string[]): Promise<EmployeeEventBatchItem[]> {
    const normalizedIds = Array.from(
      new Set(
        (employeeIds || [])
          .map((id) => id?.trim())
          .filter((id): id is string => Boolean(id))
      )
    );

    const response = await httpClient.post<EmployeeEventBatchResponse>(
      "/Employees/events/batch",
      { employeeIds: normalizedIds }
    );

    return response.data?.items || [];
  }
};