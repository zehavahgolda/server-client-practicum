import { useCallback, useEffect, useState } from "react";

import { subcategoryService } from "../services/subcategoryService";

import type {
  SubcategoryDto,
  SubcategoryFilters
} from "../types";

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<SubcategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadSubcategories = useCallback(async (filters: SubcategoryFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await subcategoryService.getSubcategories(filters);
      setSubcategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת תתי־קטגוריות");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadSubcategories();
  }, [reloadSubcategories]);

  return {
    subcategories,
    loading,
    error,
    reloadSubcategories
  };
}
