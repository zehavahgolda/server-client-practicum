export interface Change {
  id: string;
  date: string;
  title: string;
  description: string;
  impact: string;
  type: "allocation" | "employee" | "system" | "category" | "other";
  relatedEntityId?: string;
  relatedEntityName?: string;
  createdBy?: string;
}

export interface Timeline {
  month: string;
  changesCount: number;
  changes: Change[];
}

export interface ChangeFilters {
  year?: number;
  month?: number;
  type?: string;
  search?: string;
}
