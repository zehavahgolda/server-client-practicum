import { useCallback, useEffect, useMemo, useState } from "react";
import { systemService } from "../services/systemService";
import type { System, SystemDetails, SystemFilters } from "../types";

export function useSystems(initialFilters: SystemFilters = {}) {
  const [filters, setFilters] = useState<SystemFilters>(initialFilters);
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSystems = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await systemService.getSystems(filters);
      setSystems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת מערכות";
      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  const loadSystemDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const data = await systemService.getSystemById(id);
      setSelectedSystem(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת פרטי מערכת";
      setError(message);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const meta = useMemo(
    () => ({
      total: systems.length,
      atRisk: systems.filter((sys) => sys.gap > 4).length,
      inShortage: systems.filter((sys) => sys.gap > 0 && sys.gap <= 4).length,
      balanced: systems.filter((sys) => sys.gap === 0 || sys.gap < 0).length,
      totalGap: systems.reduce((sum, sys) => sum + Math.max(0, sys.gap), 0),
      totalSurplus: systems.reduce((sum, sys) => sum + Math.abs(Math.min(0, sys.gap)), 0)
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
