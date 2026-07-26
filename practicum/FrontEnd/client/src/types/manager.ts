export type ManagerStatusFilter = "active" | "inactive" | "all";

export interface ManagerListItem {
  designationId: string;
  employeeId: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  deactivatedAt?: string | null;
  assignedEmployeesCount: number;
}

export interface ManagerCreatePayload {
  employeeId: string;
}

export interface ManagerMutationResult {
  resultType: "created" | "reactivated" | "alreadyActive";
  message: string;
  manager: ManagerListItem;
}

export interface ManagerCandidate {
  employeeId: string;
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string | null;
  hasActiveDesignation: boolean;
  hasInactiveDesignation: boolean;
}

export interface ManagerDeactivateResult {
  success: boolean;
  affectedEmployeesCount: number;
  message: string;
  manager?: ManagerListItem | null;
}
