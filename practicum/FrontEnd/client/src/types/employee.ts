// src/types/employee.ts

export interface EmployeeAllocation {
  systemId: string;
  systemName: string;
  systemCapacityStatus: string; // "Shortage", "Balanced", "Excess"
  roleInSystem: string;
  plannedMonths: number;
  actualMonths: number;
  year?: number;
}

export interface EmployeeRelevantChange {
  title: string;
  date?: number;
  description?: string;
  year?: number;
}

// זה ה-Interface המרכזי לכרטיסיית הפרטים
export interface EmployeeDetails {
  id: string;
  fullName: string;
  managerName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  year: number;
  yearlyCapacityMonths: number;
  upcomingEvent?: string;
  allocatedMonths: number;
  remainingMonths: number;
  availabilityStatus: string;
  assignedSystemsCount: number;
  notes?: string;
  managerReviewNote?: string;
  relevantChanges: EmployeeRelevantChange[];
  allocations: EmployeeAllocation[]
}

// לשימוש ברשימת העובדים (List View)
export interface EmployeeListItem {
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
  year?: number;
}

export interface EmployeeUpsertPayload {
  fullName: string;
  professionalCategory: string;
  professionalSubCategory?: string;
  managerName: string;
  year: number;
  yearlyCapacityMonths: number;
  upcomingEvent?: string;
  notes?: string;
  managerReviewNote?: string;
}