import { useCallback, useEffect, useRef, useState } from "react";
import { employeeEventService } from "../services/employeeEventService";
import type {
  EmployeeEvent,
  EmployeeEventCreatePayload,
  EmployeeEventUpdatePayload
} from "../types";

export function useEmployeeEvents(employeeId?: string | null) {
  const [events, setEvents] = useState<EmployeeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const requestVersionRef = useRef(0);

  const loadEvents = useCallback(async () => {
    const normalizedEmployeeId = employeeId?.trim();
    requestVersionRef.current += 1;
    const currentRequestVersion = requestVersionRef.current;

    if (!normalizedEmployeeId) {
      setEvents([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await employeeEventService.getEmployeeEvents(normalizedEmployeeId);
      if (currentRequestVersion !== requestVersionRef.current) {
        return;
      }

      setEvents(data);
    } catch (err) {
      if (currentRequestVersion !== requestVersionRef.current) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "שגיאה בטעינת אירועי עובד";
      setError(message);
      setEvents([]);
    } finally {
      if (currentRequestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [employeeId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const createEvent = useCallback(
    async (payload: EmployeeEventCreatePayload) => {
      const normalizedEmployeeId = employeeId?.trim();
      if (!normalizedEmployeeId || mutating) {
        return;
      }

      setMutating(true);
      setError(null);

      try {
        await employeeEventService.createEmployeeEvent(normalizedEmployeeId, payload);
        await loadEvents();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "יצירת אירוע עובד נכשלה";
        setError(message);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [employeeId, loadEvents, mutating]
  );

  const updateEvent = useCallback(
    async (eventId: string, payload: EmployeeEventUpdatePayload) => {
      const normalizedEmployeeId = employeeId?.trim();
      if (!normalizedEmployeeId || mutating) {
        return;
      }

      setMutating(true);
      setError(null);

      try {
        await employeeEventService.updateEmployeeEvent(
          normalizedEmployeeId,
          eventId,
          payload
        );
        await loadEvents();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "עדכון אירוע עובד נכשל";
        setError(message);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [employeeId, loadEvents, mutating]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const normalizedEmployeeId = employeeId?.trim();
      if (!normalizedEmployeeId || mutating) {
        return;
      }

      setMutating(true);
      setError(null);

      try {
        await employeeEventService.deleteEmployeeEvent(normalizedEmployeeId, eventId);
        await loadEvents();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "מחיקת אירוע עובד נכשלה";
        setError(message);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [employeeId, loadEvents, mutating]
  );

  return {
    events,
    loading,
    error,
    reload: loadEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}