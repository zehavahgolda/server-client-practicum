import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { categoryService } from "../services/categoryService";
import { logger } from "../services/logging/logger";

import type {
  Category,
  CategoryDetails,
  CategoryFilters
} from "../types";

type HttpError = Error & {
  status?: number;
};

// זמן ברירת מחדל לניסיון טעינה מחדש כשה-endpoint לא זמין.
const RETRY_INTERVAL_SECONDS = 30;

// Hook לניהול נתוני קטגוריות: רשימה, פריט נבחר, טעינות, שגיאות ופילטרים.
export function useCategories(initialFilters: CategoryFilters = {}) {
  const [filters, setFilters] =
    useState<CategoryFilters>(initialFilters);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryDetails | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [retryInSeconds, setRetryInSeconds] = useState(
    RETRY_INTERVAL_SECONDS
  );

  // מונע כתיבת warn חוזר בכל ניסיון retry בזמן שה-endpoint עדיין לא זמין.
  const endpointWarningLoggedRef = useRef(false);

  // טוען את רשימת הקטגוריות לפי הפילטרים הנוכחיים ומעדכן סטייט תואם.
  // במקרה של 404 מסמן שהפיצ'ר אינו זמין ומפעיל מנגנון retry מבוקר.
  const loadCategories = useCallback(async () => {
    setLoadingList(true);
    setError(null);

    try {
      const data = await categoryService.getCategories(filters);

      setCategories(data);
      setEndpointAvailable(true);
      setRetryInSeconds(RETRY_INTERVAL_SECONDS);

      // אם השירות חזר לעבוד, מאפשר לכתוב warn חדש במקרה של נפילה עתידית.
      endpointWarningLoggedRef.current = false;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "שגיאה בטעינת קטגוריות";

      const status = (err as HttpError | null)?.status;

      if (status === 404 || message.includes("404")) {
        if (!endpointWarningLoggedRef.current) {
          logger.warn("Categories endpoint is unavailable", {
            feature: "categories",
            action: "loadCategories",
            status,
            filters,
            retryIntervalSeconds: RETRY_INTERVAL_SECONDS
          });

          endpointWarningLoggedRef.current = true;
        }

        setEndpointAvailable(false);
        setCategories([]);
        setError("פיצ'ר קטגוריות עדיין לא זמין בשרת.");
      } else {
        logger.error("Failed to load categories", err, {
          feature: "categories",
          action: "loadCategories",
          status,
          filters
        });

        setError(message);
      }
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  // טוען פרטי קטגוריה מלאה לפי מזהה עבור תצוגת פירוט.
  // הפעולה מדולגת אוטומטית אם ידוע שה-endpoint כרגע לא זמין.
  const loadCategoryDetails = useCallback(
    async (id: string) => {
      if (!endpointAvailable) {
        return;
      }

      setLoadingDetails(true);
      setError(null);

      try {
        const data = await categoryService.getCategoryById(id);
        setSelectedCategory(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "שגיאה בטעינת פרטי קטגוריה";

        const status = (err as HttpError | null)?.status;

        logger.error("Failed to load category details", err, {
          feature: "categories",
          action: "loadCategoryDetails",
          entityId: id,
          status
        });

        setError(message);
      } finally {
        setLoadingDetails(false);
      }
    },
    [endpointAvailable]
  );

  // מפעיל טעינה ראשונית ובכל שינוי של פונקציית הטעינה.
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // מפעיל ספירה לאחור וניסיון חוזר לטעינה כאשר השירות לא זמין זמנית.
  useEffect(() => {
    if (endpointAvailable) {
      return;
    }

    setRetryInSeconds(RETRY_INTERVAL_SECONDS);

    const retryTimer = window.setInterval(() => {
      setRetryInSeconds((current) => {
        if (current <= 1) {
          void loadCategories();
          return RETRY_INTERVAL_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(retryTimer);
    };
  }, [endpointAvailable, loadCategories]);

  // מחשב נתוני סיכום להצגה מהירה בכרטיסי KPI וברכיבי Header.
  const meta = useMemo(
    () => ({
      total: categories.length,
      totalEmployees: categories.reduce(
        (sum, category) => sum + category.employeesCount,
        0
      ),
      totalCapacity: categories.reduce(
        (sum, category) => sum + category.totalCapacityMonths,
        0
      ),
      totalAllocated: categories.reduce(
        (sum, category) => sum + category.allocatedMonths,
        0
      ),
      avgUtilization:
        categories.length > 0
          ? Math.round(
              categories.reduce(
                (sum, category) => sum + category.utilizationRate,
                0
              ) / categories.length
            )
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