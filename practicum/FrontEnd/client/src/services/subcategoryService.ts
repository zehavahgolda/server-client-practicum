import httpClient from "./api/httpClient";
import type {
  SubcategoryCreatePayload,
  SubcategoryDto,
  SubcategoryFilters,
  SubcategoryUpdatePayload
} from "../types";

export const subcategoryService = {
  async getSubcategories(filters: SubcategoryFilters = {}): Promise<SubcategoryDto[]> {
    const response = await httpClient.get<SubcategoryDto[]>("/Category/subcategories", {
      params: {
        search: filters.search,
        parentCategoryId: filters.parentCategoryId
      }
    });

    return response.data || [];
  },

  async createSubcategory(payload: SubcategoryCreatePayload): Promise<SubcategoryDto> {
    const response = await httpClient.post<SubcategoryDto>("/Category/subcategories", payload);
    return response.data;
  },

  async updateSubcategory(id: string, payload: SubcategoryUpdatePayload): Promise<SubcategoryDto> {
    const response = await httpClient.put<SubcategoryDto>(`/Category/subcategories/${id}`, payload);
    return response.data;
  },

  async deactivateSubcategory(id: string): Promise<void> {
    await httpClient.delete(`/Category/subcategories/${id}`);
  }
};
