export interface System {
  id: string;
  name: string;
  requiredCapacityMonths: number;
  allocatedMonths: number;
  gap: number;
  capacityStatus: string;
  assignedEmployeesCount: number;
}

export interface SystemAssignedEmployee {
  id: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  allocatedMonths: number;
}

export interface SystemBudgetInfo {
  totalBudget: number;
  totalPlannedMonths: number;
  totalActualMonths: number;
  variancePercent: number;
}

export interface SystemDetails extends System {
  managementNote?: string;
  updatedAt?: string;
  assignedEmployees: SystemAssignedEmployee[];
  changes: Array<{
    date: string;
    title: string;
    impact: string;
    type?: string;
  }>;
  budget: SystemBudgetInfo;
}

export interface SystemFilters {
  year?: number;
  status?: string;
  search?: string;
}
