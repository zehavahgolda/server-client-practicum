import { useCallback, useEffect, useMemo, useState } from "react";
import { changeService } from "../services/changeService";
import type { Change, Timeline, ChangeFilters } from "../types";

// טיפוס שגיאה מורחב לצורך קריאת קוד סטטוס HTTP כשזמין.
type HttpError = Error & {
  status?: number;
};

// מחזיר את שנת העבודה הפעילה כברירת מחדל לפילטרים.
function getActiveYear() {
  return new Date().getFullYear();
}

const RETRY_INTERVAL_SECONDS = 30;

// Hook לניהול מסך השינויים: רשימה, ציר זמן, טעינה, שגיאות ופילטרים.
export function useChanges(initialFilters: ChangeFilters = {}) {
  const [filters, setFilters] = useState<ChangeFilters>({
    ...initialFilters,
    year: initialFilters.year ?? getActiveYear()
  });
  const [changes, setChanges] = useState<Change[]>([]);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [retryInSeconds, setRetryInSeconds] = useState(RETRY_INTERVAL_SECONDS);

  // טוען את רשימת השינויים לפי פילטרים ומטפל בתרחיש endpoint לא זמין.
  const loadChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await changeService.getChanges(filters);
      setChanges(data);
      setEndpointAvailable(true);
      setRetryInSeconds(RETRY_INTERVAL_SECONDS);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת שינויים";
      const status = (err as HttpError | null)?.status;
      if (status === 404 || message.includes("404")) {
        setEndpointAvailable(false);
        setChanges([]);
        setError("פיצ'ר שינויים/Timeline עדיין לא זמין בשרת.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // טוען נתוני ציר זמן לשנה הנבחרת כאשר השירות זמין.
  const loadTimeline = useCallback(async () => {
    if (!endpointAvailable) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await changeService.getTimeline(filters.year);
      setTimeline(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת ציר הזמן";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [endpointAvailable, filters.year]);

  // מפעיל טעינה ראשונית של רשימת השינויים.
  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  // מפעיל retry מחזורי כאשר endpoint לא זמין זמנית.
  useEffect(() => {
    if (endpointAvailable) {
      return;
    }

    setRetryInSeconds(RETRY_INTERVAL_SECONDS);
    const retryTimer = window.setInterval(() => {
      setRetryInSeconds((current) => {
        if (current <= 1) {
          loadChanges();
          return RETRY_INTERVAL_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(retryTimer);
    };
  }, [endpointAvailable, loadChanges]);

  // מחשב נתוני סיכום לפי סוג שינוי להצגה מהירה ב-UI.
  const meta = useMemo(
    () => ({
      total: changes.length,
      byType: {
        allocation: changes.filter((c) => c.type === "allocation").length,
        employee: changes.filter((c) => c.type === "employee").length,
        system: changes.filter((c) => c.type === "system").length,
        category: changes.filter((c) => c.type === "category").length
      }
    }),
    [changes]
  );

  return {
    changes,
    timeline,
    loading,
    error,
    endpointAvailable,
    retryInSeconds,
    filters,
    setFilters,
    loadChanges,
    loadTimeline,
    meta
  };
}
