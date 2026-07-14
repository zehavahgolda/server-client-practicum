// src/types/employee.ts

export interface EmployeeAllocation {
  systemId: string;
  systemName: string;
  systemCapacityStatus: string;
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

// פרטי עובד מלאים.
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
  isActive: boolean;
  notes?: string;
  managerReviewNote?: string;
  relevantChanges: EmployeeRelevantChange[];
  allocations: EmployeeAllocation[];
}

// עובד ברשימה.
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
  isActive: boolean;
  year?: number;
}

// נתונים ליצירה או עדכון עובד.
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
  isActive?: boolean;
}