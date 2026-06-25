export interface EmployeeAssignmentCandidate {
  id: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  managerName: string;
  yearlyCapacityMonths: number;
  allocatedMonths: number;
  remainingMonths: number;
  availabilityStatus: string;
  assignedSystemsCount: number;
  alreadyAssignedToSystem: boolean;
  canAssign: boolean;
}

export interface EmployeeAssignmentItem {
  employeeId: string;
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
}

export interface BulkAssignEmployeesDto {
  systemId: string;
  employees: EmployeeAssignmentItem[];
}

export interface BulkAssignEmployeesResult {
  isSuccess: boolean;
  assignedCount: number;
  errors: string[];
}