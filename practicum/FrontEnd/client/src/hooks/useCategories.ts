import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryService } from "../services/categoryService";
import type { Category, CategoryDetails, CategoryFilters } from "../types";

const RETRY_INTERVAL_SECONDS = 30;

export function useCategories(initialFilters: CategoryFilters = {}) {
  const [filters, setFilters] = useState<CategoryFilters>(initialFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [retryInSeconds, setRetryInSeconds] = useState(RETRY_INTERVAL_SECONDS);

  const loadCategories = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await categoryService.getCategories(filters);
      setCategories(data);
      setEndpointAvailable(true);
      setRetryInSeconds(RETRY_INTERVAL_SECONDS);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת קטגוריות";
      if (message.includes("404")) {
        setEndpointAvailable(false);
        setCategories([]);
        setError("פיצ'ר קטגוריות עדיין לא זמין בשרת.");
      } else {
        setError(message);
      }
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  const loadCategoryDetails = useCallback(async (id: string) => {
    if (!endpointAvailable) {
      return;
    }

    setLoadingDetails(true);
    setError(null);
    try {
      const data = await categoryService.getCategoryById(id);
      setSelectedCategory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת פרטי קטגוריה";
      setError(message);
    } finally {
      setLoadingDetails(false);
    }
  }, [endpointAvailable]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (endpointAvailable) {
      return;
    }

    setRetryInSeconds(RETRY_INTERVAL_SECONDS);
    const retryTimer = window.setInterval(() => {
      setRetryInSeconds((current) => {
        if (current <= 1) {
          loadCategories();
          return RETRY_INTERVAL_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(retryTimer);
    };
  }, [endpointAvailable, loadCategories]);

  const meta = useMemo(
    () => ({
      total: categories.length,
      totalEmployees: categories.reduce((sum, c) => sum + c.employeesCount, 0),
      totalCapacity: categories.reduce((sum, c) => sum + c.totalCapacityMonths, 0),
      totalAllocated: categories.reduce((sum, c) => sum + c.allocatedMonths, 0),
      avgUtilization:
        categories.length > 0
          ? Math.round(categories.reduce((sum, c) => sum + c.utilizationRate, 0) / categories.length)
          : 0
    }),
    [categories]
  );

  return {
    categories,
    selectedCategory,
    loadingList,
    loadingDetails,
    error,
    endpointAvailable,
    retryInSeconds,
    filters,
    setFilters,
    loadCategories,
    loadCategoryDetails,
    setSelectedCategory,
    meta
  };
}
