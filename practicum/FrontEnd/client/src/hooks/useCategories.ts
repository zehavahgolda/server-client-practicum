import {
  useEffect,
  useState
} from "react";

import { categoryService } from "../services/categoryService";
import type { CategoryDto } from "../types";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reloadCategories() {
    setLoading(true);
    setError(null);

    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת קטגוריות");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    reloadCategories
  };
}