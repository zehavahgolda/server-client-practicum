export type OrganizationEventScopeType = "AllOrganization" | "SelectedSystems";
export type OrganizationEventStatus = "Active" | "Future" | "Completed";

export interface OrganizationEventTargetSystem {
  id: string;
  name: string;
}

export interface OrganizationEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  scopeType: OrganizationEventScopeType;
  targetSystemIds: string[];
  targetSystems: OrganizationEventTargetSystem[];
  status: OrganizationEventStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface OrganizationEventFilters {
  search?: string;
  status?: OrganizationEventStatus;
  scopeType?: OrganizationEventScopeType;
  systemId?: string;
}

export interface OrganizationEventCreatePayload {
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  scopeType: OrganizationEventScopeType;
  targetSystemIds: string[];
}

export interface OrganizationEventUpdatePayload extends OrganizationEventCreatePayload {}