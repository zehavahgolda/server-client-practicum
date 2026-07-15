export interface System {
  id: string;
  name: string;
  year?: number;
  requiredCapacityMonths: number;
  allocatedMonths: number;
  gap: number;
  capacityStatus: string;
  assignedEmployeesCount: number;
  managementNote?: string;

  allocatedBudget: number;
  usedBudget: number;
  budgetGap: number;
}

export interface SystemAssignedEmployee {
  employeeId: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  managerName: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
  availabilityStatus: string;
}

export interface SystemDetails extends System {
  updatedAt?: string;
  assignedEmployees: SystemAssignedEmployee[];
  changes: Array<{
    date: string;
    title: string;
    impact: string;
    type?: string;
  }>;

  allocatedBudget: number;
  usedBudget: number;
  budgetGap: number;

  totalBudget: number;
  totalPlannedMonths: number;
  totalActualMonths: number;
  variancePercent: number;
}

export interface SystemFilters {
  year?: number;
  status?: string;
  ownerManagerName?: string;
  search?: string;
  categoryName?: string;
}
export interface SystemCreateDto {
  name: string;
  year: number;
  requiredCapacityMonths: number;
  allocatedBudget: number;
  managementNote?: string;
}

export interface SystemUpdateDto {
  name: string;
  requiredCapacityMonths: number;
  allocatedBudget: number;
  managementNote?: string;
}
