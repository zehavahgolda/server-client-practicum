import { useCallback, useEffect, useMemo, useState } from "react";

import { allocationService } from "../services/allocationService";
import { employeeService } from "../services/employeeService";
import { logger } from "../services/logging/logger";

import type { EmployeeFilters } from "../types/filters";
import type {
  EmployeeDetails,
  EmployeeListItem,
  EmployeeUpsertPayload
} from "../types/employee";

// Hook לניהול מסך עובדים: טעינת רשימה/פירוט, יצירה/עדכון והקצאות.
export function useEmployees(
  initialFilters: EmployeeFilters = {}
) {
  const [filters, setFilters] =
    useState<EmployeeFilters>(initialFilters);

  const [employees, setEmployees] =
    useState<EmployeeListItem[]>([]);

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeDetails | null>(null);

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
      const message =
        err instanceof Error
          ? err.message
          : "שגיאה בטעינת עובדים";

      logger.error("Failed to load employees", err, {
        feature: "employees",
        action: "loadEmployees",
        filters
      });

      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  // טוען פרטי עובד מלאים לפי מזהה.
  const loadEmployeeDetails = useCallback(
    async (id: string) => {
      setLoadingDetails(true);
      setError(null);

      try {
        const data = await employeeService.getEmployeeById(id);
        setSelectedEmployee(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "שגיאה בטעינת פרטי עובד";

        logger.error(
          "Failed to load employee details",
          err,
          {
            feature: "employees",
            action: "loadEmployeeDetails",
            entityId: id
          }
        );

        setError(message);
      } finally {
        setLoadingDetails(false);
      }
    },
    []
  );

  // מעדכן חודשי ביצוע להקצאה קיימת ומרענן את הנתונים.
  const updateActualMonths = useCallback(
    async (
      systemId: string,
      roleInSystem: string,
      actualMonths: number
    ) => {
      if (!selectedEmployee?.id) {
        return;
      }

      const employeeId = selectedEmployee.id;

      setError(null);

      try {
        await allocationService.updateAllocationMonths({
          employeeId,
          systemId,
          roleInSystem,
          actualMonths
        });

        logger.info("Allocation updated", {
          feature: "employees",
          action: "updateActualMonths",
          entityId: employeeId,
          systemId
        });

        await loadEmployeeDetails(employeeId);
        await loadEmployees();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "עדכון ההקצאה נכשל";

        logger.error(
          "Failed to update allocation",
          err,
          {
            feature: "employees",
            action: "updateActualMonths",
            entityId: employeeId,
            systemId
          }
        );

        setError(message);
      }
    },
    [
      selectedEmployee?.id,
      loadEmployeeDetails,
      loadEmployees
    ]
  );

  // מוסיף הקצאה חדשה לעובד הנבחר ומרענן את הנתונים.
  const addAllocation = useCallback(
    async (payload: {
      systemId: string;
      roleInSystem: string;
      plannedMonths: number;
      actualMonths: number;
    }) => {
      if (!selectedEmployee?.id) {
        return;
      }

      const employeeId = selectedEmployee.id;

      setError(null);

      try {
        await allocationService.addAllocation(
          employeeId,
          payload
        );

        logger.info("Allocation added", {
          feature: "employees",
          action: "addAllocation",
          entityId: employeeId,
          systemId: payload.systemId
        });

        await loadEmployeeDetails(employeeId);
        await loadEmployees();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "הוספת הקצאה נכשלה";

        logger.error("Failed to add allocation", err, {
          feature: "employees",
          action: "addAllocation",
          entityId: employeeId,
          systemId: payload.systemId
        });

        setError(message);
      }
    },
    [
      selectedEmployee?.id,
      loadEmployeeDetails,
      loadEmployees
    ]
  );

  // יוצר עובד חדש, מרענן את הרשימה וטוען את פרטיו.
  const createEmployee = useCallback(
    async (payload: EmployeeUpsertPayload) => {
      setLoadingCreate(true);
      setError(null);

      try {
        const createdEmployee =
          await employeeService.createEmployee(payload);

        logger.info("Employee created", {
          feature: "employees",
          action: "createEmployee",
          entityId: createdEmployee?.id
        });

        await loadEmployees();

        if (createdEmployee?.id) {
          await loadEmployeeDetails(createdEmployee.id);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "הוספת עובד נכשלה";

        logger.error(
          "Failed to create employee",
          err,
          {
            feature: "employees",
            action: "createEmployee"
          }
        );

        setError(message);
      } finally {
        setLoadingCreate(false);
      }
    },
    [loadEmployeeDetails, loadEmployees]
  );

  // מעדכן עובד קיים, מרענן את הרשימה וטוען את פרטיו.
  const updateEmployee = useCallback(
    async (
      id: string,
      payload: EmployeeUpsertPayload
    ) => {
      setError(null);

      try {
        const updatedEmployee =
          await employeeService.updateEmployee(id, payload);

        logger.info("Employee updated", {
          feature: "employees",
          action: "updateEmployee",
          entityId: id
        });

        await loadEmployees();

        if (updatedEmployee?.id) {
          await loadEmployeeDetails(updatedEmployee.id);
        } else {
          await loadEmployeeDetails(id);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "עדכון העובד נכשל";

        logger.error(
          "Failed to update employee",
          err,
          {
            feature: "employees",
            action: "updateEmployee",
            entityId: id
          }
        );

        setError(message);
      }
    },
    [loadEmployeeDetails, loadEmployees]
  );

  // טעינה ראשונית ובכל שינוי פילטרים.
  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  // מחשב נתוני סיכום על מצב העובדים.
  const meta = useMemo(
    () => ({
      total: employees.length,
      lowCapacity: employees.filter(
        (employee) => employee.remainingMonths <= 1
      ).length,
      overloaded: employees.filter(
        (employee) => employee.remainingMonths < 0
      ).length
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