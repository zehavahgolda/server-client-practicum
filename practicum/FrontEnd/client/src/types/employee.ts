export interface EmployeeListItem {
  id: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  managerName: string;
  year: number;
  yearlyCapacityMonths: number;
  allocatedMonths: number;
  remainingMonths: number;
  availabilityStatus: string;
  assignedSystemsCount: number;
  upcomingEvent?: string;
}

// Server API response (raw from backend)
export interface EmployeeServerResponse {
  _id: string;
  name: string;
  departmentId: string;
  year: number;
  totalActualMonths: number;
  allocations: Array<{
    systemId: string;
    systemName?: string;
    roleInSystem: string;
    plannedMonths: number;
    actualMonths: number;
  }>;
}

export interface EmployeeAllocation {
  systemId: string;
  systemName: string;
  systemCapacityStatus: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
}

export interface EmployeeDetails extends EmployeeListItem {
  notes?: string;
  managerReviewNote?: string;
  relevantChanges: Array<{
    date: string;
    title: string;
    impact: string;
    type?: string;
  }>;
  allocations: EmployeeAllocation[];
}

export interface EmployeeFilters {
  year?: number;
  managerName?: string;
  professionalCategory?: string;
  systemId?: string;
  search?: string;
}
