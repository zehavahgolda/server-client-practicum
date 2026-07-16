export interface SubcategoryDto {
  id: string;
  name: string;
  parentCategoryId: string;
  parentCategoryName: string;
}

export interface SubcategoryCreatePayload {
  name: string;
  parentCategoryId: string;
}

export interface SubcategoryUpdatePayload {
  name: string;
  parentCategoryId: string;
}

export interface SubcategoryFilters {
  search?: string;
  parentCategoryId?: string;
}
