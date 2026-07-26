import { useCallback, useEffect, useState } from "react";

import { managerService } from "../services/managerService";
import type {
  ManagerCandidate,
  ManagerCreatePayload,
  ManagerListItem,
  ManagerMutationResult,
  ManagerStatusFilter
} from "../types";

export function useManagers(initialStatus: ManagerStatusFilter = "active") {
  const [managers, setManagers] = useState<ManagerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadManagers = useCallback(async (params: { status?: ManagerStatusFilter; search?: string } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const rows = await managerService.getManagers({
        status: params.status ?? initialStatus,
        search: params.search
      });

      setManagers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת מנהלים");
    } finally {
      setLoading(false);
    }
  }, [initialStatus]);

  const getCandidates = useCallback(async (search?: string): Promise<ManagerCandidate[]> => {
    return managerService.getCandidates({ search });
  }, []);

  const addManager = useCallback(async (payload: ManagerCreatePayload): Promise<ManagerMutationResult> => {
    return managerService.addManager(payload);
  }, []);

  const deactivateManager = useCallback(async (designationId: string, deactivationReason?: string) => {
    return managerService.deactivateManager(designationId, deactivationReason);
  }, []);

  const reactivateManager = useCallback(async (designationId: string): Promise<ManagerMutationResult> => {
    return managerService.reactivateManager(designationId);
  }, []);

  useEffect(() => {
    void reloadManagers({ status: initialStatus });
  }, [initialStatus, reloadManagers]);

  return {
    managers,
    loading,
    error,
    reloadManagers,
    getCandidates,
    addManager,
    deactivateManager,
    reactivateManager
  };
}
