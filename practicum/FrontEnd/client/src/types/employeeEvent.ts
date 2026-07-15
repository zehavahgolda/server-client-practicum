export interface EmployeeEvent {
  id: string;
  employeeId: string;
  eventType: string;
  customEventType?: string | null;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface EmployeeEventCreatePayload {
  eventType: string;
  customEventType?: string | null;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface EmployeeEventUpdatePayload {
  eventType: string;
  customEventType?: string | null;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface EmployeeEventBatchRequest {
  employeeIds: string[];
}

export interface EmployeeEventBatchItem {
  employeeId: string;
  events: EmployeeEvent[];
}

export interface EmployeeEventBatchResponse {
  items: EmployeeEventBatchItem[];
}