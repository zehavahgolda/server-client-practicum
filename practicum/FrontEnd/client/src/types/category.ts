export interface Category {
  id: string;
  name: string;
  description?: string;
  employeesCount: number;
  totalCapacityMonths: number;
  allocatedMonths: number;
  utilizationRate: number;
  averageAllocation: number;
}

export interface CategoryDetails extends Category {
  employees: Array<{
    id: string;
    fullName: string;
    manager: string;
    allocatedMonths: number;
    remainingMonths: number;
    status: string;
  }>;
  systemsDistribution: Array<{
    systemId: string;
    systemName: string;
    employeeCount: number;
    totalMonths: number;
  }>;
}

export interface CategoryFilters {
  search?: string;
  year?: number;
}
