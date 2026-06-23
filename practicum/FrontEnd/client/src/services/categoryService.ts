import httpClient from "./api/httpClient";
import type { Category, CategoryDetails, CategoryFilters } from "../types";

export const categoryService = {
  async getCategories(filters: CategoryFilters = {}): Promise<Category[]> {
    const response = await httpClient.get<Category[]>("/Category", {
      params: filters
    });
    return response.data || [];
  },

  async getCategoryById(id: string): Promise<CategoryDetails> {
    const response = await httpClient.get<CategoryDetails>(`/Category/${id}`);
    return {
      ...response.data,
      employees: response.data.employees || [],
      systemsDistribution: response.data.systemsDistribution || []
    };
  }
};
