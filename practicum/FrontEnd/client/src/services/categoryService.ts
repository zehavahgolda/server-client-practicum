import httpClient from "./api/httpClient";
import type { Category, CategoryDetails, CategoryFilters } from "../types";

export const categoryService = {
  // מחזירה את רשימת הקטגוריות לפי פילטרים אופציונליים.
  // הפילטרים נשלחים כ-query params כדי לבצע סינון כבר בצד השרת.
  async getCategories(filters: CategoryFilters = {}): Promise<Category[]> {
    const response = await httpClient.get<Category[]>("/Category", {
      params: filters
    });
    return response.data || [];
  },

  // מחזירה פרטי קטגוריה מלאה לפי מזהה קטגוריה.
  // בנוסף מבצעת נרמול לשדות מערכיים כדי להבטיח תמיד מערכים תקינים בקליינט.
  async getCategoryById(id: string): Promise<CategoryDetails> {
    const response = await httpClient.get<CategoryDetails>(`/Category/${id}`);
    return {
      ...response.data,
      employees: response.data.employees || [],
      systemsDistribution: response.data.systemsDistribution || []
    };
  }
};
