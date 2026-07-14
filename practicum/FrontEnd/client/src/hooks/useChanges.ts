import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { changeService } from "../services/changeService";
import { logger } from "../services/logging/logger";

import type { Change, ChangeFilters, Timeline } from "../types";

import { getActiveYear } from "../utils/yearOptions";

// טיפוס שגיאה מורחב לצורך קריאת קוד סטטוס HTTP כשזמין.
type HttpError = Error & {
  status?: number;
};

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
  const [retryInSeconds, setRetryInSeconds] = useState(
    RETRY_INTERVAL_SECONDS
  );

  // מונע כתיבת warn חוזר בכל ניסיון retry בזמן שה-endpoint עדיין לא זמין.
  const endpointWarningLoggedRef = useRef(false);

  // טוען את רשימת השינויים לפי פילטרים ומטפל בתרחיש endpoint לא זמין.
  const loadChanges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await changeService.getChanges(filters);

      setChanges(data);
      setEndpointAvailable(true);
      setRetryInSeconds(RETRY_INTERVAL_SECONDS);

      // אם השירות חזר לעבוד, מאפשר לכתוב warn חדש במקרה של נפילה עתידית.
      endpointWarningLoggedRef.current = false;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "שגיאה בטעינת שינויים";

      const status = (err as HttpError | null)?.status;

      if (status === 404 || message.includes("404")) {
        if (!endpointWarningLoggedRef.current) {
          logger.warn("Changes endpoint is unavailable", {
            feature: "changes",
            action: "loadChanges",
            status,
            filters,
            retryIntervalSeconds: RETRY_INTERVAL_SECONDS
          });

          endpointWarningLoggedRef.current = true;
        }

        setEndpointAvailable(false);
        setChanges([]);
        setError("פיצ'ר שינויים/Timeline עדיין לא זמין בשרת.");
      } else {
        logger.error("Failed to load changes", err, {
          feature: "changes",
          action: "loadChanges",
          status,
          filters
        });

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
      const message =
        err instanceof Error ? err.message : "שגיאה בטעינת ציר הזמן";

      const status = (err as HttpError | null)?.status;

      logger.error("Failed to load timeline", err, {
        feature: "changes",
        action: "loadTimeline",
        status,
        year: filters.year
      });

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [endpointAvailable, filters.year]);

  // מפעיל טעינה ראשונית של רשימת השינויים.
  useEffect(() => {
    void loadChanges();
  }, [loadChanges]);

  // מפעיל retry מחזורי כאשר endpoint לא זמין זמנית.
  useEffect(() => {
    if (endpointAvailable) {
      return;
    }

    setRetryInSeconds(RETRY_INTERVAL_SECONDS);

    const retryTimer = window.setInterval(() => {
      setRetryInSeconds((currentValue) => {
        if (currentValue <= 1) {
          void loadChanges();
          return RETRY_INTERVAL_SECONDS;
        }

        return currentValue - 1;
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
        allocation: changes.filter(
          (change) => change.type === "allocation"
        ).length,
        employee: changes.filter(
          (change) => change.type === "employee"
        ).length,
        system: changes.filter(
          (change) => change.type === "system"
        ).length,
        category: changes.filter(
          (change) => change.type === "category"
        ).length
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