// src/types/filters.ts
export interface EmployeeFilters {
  search?: string;
  professionalCategory?: string;
  managerName?: string;
  year?: number; // הוספנו את זה כדי שהשגיאה תיעלם
}