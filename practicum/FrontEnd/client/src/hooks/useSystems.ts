
import { useCallback, useEffect, useMemo, useState } from "react";
import { systemService } from "../services/systemService";
import type { System, SystemDetails, SystemFilters } from "../types";

// Hook לניהול נתוני מערכות: רשימה, פריט נבחר, טעינה, שגיאות ופילטרים.
export function useSystems(initialFilters: SystemFilters = {}) {
  // ברירת המחדל היא ללא סינון שנה, כלומר הצגת כל השנים.
  const [filters, setFilters] = useState<SystemFilters>({
    ...initialFilters
  });

  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // טוען את רשימת המערכות לפי הפילטרים הנוכחיים ומעדכן סטייט תואם.
  const loadSystems = useCallback(async () => {
    setLoadingList(true);
    setError(null);

    try {
      const data = await systemService.getSystems(filters);
      setSystems(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "שגיאה בטעינת מערכות";

      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  // טוען פרטי מערכת מלאה לפי מזהה עבור תצוגת פירוט.
  const loadSystemDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setError(null);

    try {
      const data = await systemService.getSystemById(id);
      setSelectedSystem(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "שגיאה בטעינת פרטי מערכת";

      setError(message);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // מפעיל טעינה ראשונית ובכל שינוי פילטרים.
  useEffect(() => {
    void loadSystems();
  }, [loadSystems]);

  // מחשב נתוני סיכום על מצב המערכות להצגה מהירה ב-UI.
  const meta = useMemo(
    () => ({
      total: systems.length,
      atRisk: systems.filter((system) => system.gap > 4).length,
      inShortage: systems.filter(
        (system) => system.gap > 0 && system.gap <= 4
      ).length,
      balanced: systems.filter((system) => system.gap <= 0).length,
      totalGap: systems.reduce(
        (sum, system) => sum + Math.max(0, system.gap),
        0
      ),
      totalSurplus: systems.reduce(
        (sum, system) => sum + Math.abs(Math.min(0, system.gap)),
        0
      )
    }),
    [systems]
  );

  return {
    systems,
    selectedSystem,
    loadingList,
    loadingDetails,
    error,
    filters,
    setFilters,
    loadSystems,
    loadSystemDetails,
    setSelectedSystem,
    meta
  };
}