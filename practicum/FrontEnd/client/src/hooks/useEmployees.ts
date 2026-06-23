import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService } from "../services/employeeService";
import type { EmployeeDetails, EmployeeFilters, EmployeeListItem } from "../types";

export function useEmployees(initialFilters: EmployeeFilters = {}) {
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await employeeService.getEmployees(filters);
      setEmployees(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת עובדים";
      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  const loadEmployeeDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const data = await employeeService.getEmployeeById(id);
      setSelectedEmployee(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה בטעינת פרטי עובד";
      setError(message);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const updateActualMonths = useCallback(
    async (systemId: string, roleInSystem: string, actualMonths: number) => {
      if (!selectedEmployee?.id) return;
      setError(null);
      try {
        await employeeService.updateAllocationMonths({
          employeeId: selectedEmployee.id,
          systemId,
          roleInSystem,
          actualMonths
        });
        await loadEmployeeDetails(selectedEmployee.id);
        await loadEmployees();
      } catch (err) {
        const message = err instanceof Error ? err.message : "עדכון ההקצאה נכשל";
        setError(message);
      }
    },
    [selectedEmployee?.id, loadEmployeeDetails, loadEmployees]
  );

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const meta = useMemo(
    () => ({
      total: employees.length,
      lowCapacity: employees.filter((emp) => emp.remainingMonths <= 1).length,
      overloaded: employees.filter((emp) => emp.remainingMonths < 0).length
    }),
    [employees]
  );

  return {
    employees,
    selectedEmployee,
    loadingList,
    loadingDetails,
    error,
    filters,
    setFilters,
    loadEmployees,
    loadEmployeeDetails,
    setSelectedEmployee,
    updateActualMonths,
    meta
  };
}
