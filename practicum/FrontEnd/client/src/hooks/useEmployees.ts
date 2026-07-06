import { useCallback, useEffect, useMemo, useState } from "react";
import { allocationService } from "../services/allocationService";
import { employeeService } from "../services/employeeService";
import { type EmployeeFilters } from "../types/filters";
import { type EmployeeDetails, type EmployeeListItem, type EmployeeUpsertPayload } from "../types/employee";

// Hook לניהול מסך עובדים: טעינת רשימה/פירוט, יצירה/עדכון והקצאות.
export function useEmployees(initialFilters: EmployeeFilters = {}) {
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // טוען את רשימת העובדים לפי פילטרים ומעדכן סטייט של טעינה/שגיאה.
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

  // טוען פרטי עובד מלאים לפי מזהה לצורך תצוגת פרופיל ופעולות המשך.
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

  // מעדכן חודשי ביצוע להקצאה קיימת ומרענן את נתוני העובד והרשימה.
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

  // מוסיף הקצאה חדשה לעובד הנבחר ולאחר מכן מבצע רענון נתונים עקבי במסך.
  const addAllocation = useCallback(
    async (payload: { systemId: string; roleInSystem: string; plannedMonths: number; actualMonths: number }) => {
      if (!selectedEmployee?.id) return;
      setError(null);
      try {
        await allocationService.addAllocation(selectedEmployee.id, payload);
        await loadEmployeeDetails(selectedEmployee.id);
        await loadEmployees();
      } catch (err) {
        const message = err instanceof Error ? err.message : "הוספת הקצאה נכשלה";
        setError(message);
      }
    },
    [selectedEmployee?.id, loadEmployeeDetails, loadEmployees]
  );

  // יוצר עובד חדש, מרענן את הרשימה, ואם נוצר מזהה טוען גם את פרטי העובד החדש.
  const createEmployee = useCallback(
    async (payload: EmployeeUpsertPayload) => {
      setLoadingCreate(true);
      setError(null);
      try {
        const createdEmployee = await employeeService.createEmployee(payload);
        await loadEmployees();

        if (createdEmployee?.id) {
          await loadEmployeeDetails(createdEmployee.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "הוספת עובד נכשלה";
        setError(message);
      } finally {
        setLoadingCreate(false);
      }
    },
    [loadEmployeeDetails, loadEmployees]
  );

  // מעדכן עובד קיים, מרענן את הרשימה, ואז טוען את פרטי העובד המעודכנים.
  const updateEmployee = useCallback(
    async (id: string, payload: EmployeeUpsertPayload) => {
      setError(null);
      try {
        const updatedEmployee = await employeeService.updateEmployee(id, payload);
        await loadEmployees();

        if (updatedEmployee?.id) {
          await loadEmployeeDetails(updatedEmployee.id);
        } else {
          await loadEmployeeDetails(id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "עדכון העובד נכשל";
        setError(message);
      }
    },
    [loadEmployeeDetails, loadEmployees]
  );

  // טעינה ראשונית של רשימת עובדים בעת עליית הקומפוננטה או שינוי תלויות.
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // מחשב נתוני סיכום על מצב העובדים להצגה מהירה ב-UI.
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
    loadingCreate,
    error,
    filters,
    setFilters,
    loadEmployees,
    loadEmployeeDetails,
    setSelectedEmployee,
    createEmployee,
    updateEmployee,
    addAllocation,
    updateActualMonths,
    meta
  };
}
