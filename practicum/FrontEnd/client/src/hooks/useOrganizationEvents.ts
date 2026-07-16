import { useCallback, useEffect, useState } from "react";

import { organizationEventService } from "../services/organizationEventService";

import type {
  OrganizationEvent,
  OrganizationEventFilters
} from "../types";

export function useOrganizationEvents() {
  const [organizationEvents, setOrganizationEvents] = useState<OrganizationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadOrganizationEvents = useCallback(async (filters: OrganizationEventFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await organizationEventService.getOrganizationEvents(filters);
      setOrganizationEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת אירועים כלל־ארגוניים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadOrganizationEvents();
  }, [reloadOrganizationEvents]);

  return {
    organizationEvents,
    loading,
    error,
    reloadOrganizationEvents
  };
}