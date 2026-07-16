import httpClient from "./api/httpClient";
import type {
  CategoryCreatePayload,
  CategoryDto,
  CategoryUpdatePayload
} from "../types";

export const categoryService = {
  async getCategories(): Promise<CategoryDto[]> {
    const response = await httpClient.get<CategoryDto[]>("/Category");
    return response.data || [];
  },

  async createCategory(payload: CategoryCreatePayload): Promise<CategoryDto> {
    const response = await httpClient.post<CategoryDto>("/Category", payload);
    return response.data;
  },

  async updateCategory(id: string, payload: CategoryUpdatePayload): Promise<CategoryDto> {
    const response = await httpClient.put<CategoryDto>(`/Category/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await httpClient.delete(`/Category/${id}`);
  }
};
