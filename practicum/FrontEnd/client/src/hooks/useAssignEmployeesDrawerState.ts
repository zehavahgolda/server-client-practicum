import { useEffect, useMemo, useState } from "react";

import { assignmentService } from "../services/assignmentService";
import { logger } from "../services/logging/logger";

import type {
  BulkAssignEmployeesDto,
  EmployeeAssignmentCandidate,
  EmployeeAssignmentItem,
  SystemDetails
} from "../types";

interface UseAssignEmployeesDrawerStateParams {
  open: boolean;
  system: SystemDetails | null;
  year?: number;
  onClose: () => void;
  onAssigned: () => Promise<void> | void;
  getDefaultRole: (
    employee: EmployeeAssignmentCandidate
  ) => string;
  clampMonths: (value: number, max: number) => number;
}

export interface UseAssignEmployeesDrawerStateResult {
  selected: Record<string, EmployeeAssignmentItem>;
  search: string;
  loading: boolean;
  saving: boolean;
  errors: string[];
  visibleEmployees: EmployeeAssignmentCandidate[];
  selectedCount: number;
  setSearch: (value: string) => void;
  toggleEmployee: (
    employee: EmployeeAssignmentCandidate
  ) => void;
  updateMonths: (
    employee: EmployeeAssignmentCandidate,
    months: number
  ) => void;
  saveAssignments: () => Promise<void>;
}

export function useAssignEmployeesDrawerState({
  open,
  system,
  year,
  onClose,
  onAssigned,
  getDefaultRole,
  clampMonths
}: UseAssignEmployeesDrawerStateParams): UseAssignEmployeesDrawerStateResult {
  const [employees, setEmployees] = useState<
    EmployeeAssignmentCandidate[]
  >([]);

  const [selected, setSelected] = useState<
    Record<string, EmployeeAssignmentItem>
  >({});

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // טוען מועמדים לשיבוץ לפי מערכת, שנה וחיפוש עם debounce קצר.
  useEffect(() => {
    if (!open || !system) {
      return;
    }

    const currentSystem = system;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrors([]);

      try {
        const data =
          await assignmentService.getAssignmentCandidates({
            systemId: currentSystem.id,
            year,
            search: search.trim() || undefined
          });

        if (!cancelled) {
          setEmployees(data);
        }
      } catch (error) {
        logger.error(
          "Failed to load assignment candidates",
          error,
          {
            feature: "systems",
            action: "loadAssignmentCandidates",
            entityId: currentSystem.id,
            year
          }
        );

        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "שגיאה בטעינת עובדים לשיבוץ.";

          setErrors([message]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void load();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, system, year, search]);

  // מאפס מצב מקומי בכל סגירה של המגירה.
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected({});
      setErrors([]);
      setEmployees([]);
    }
  }, [open]);

  const selectedCount = Object.keys(selected).length;

  // מסנן עובדים מקומית לפי מחרוזת החיפוש.
  const visibleEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [
        employee.fullName,
        employee.professionalCategory,
        employee.professionalSubCategory,
        employee.managerName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [employees, search]);

  // מוסיף או מסיר עובד מרשימת העובדים שנבחרו לשיבוץ/עדכון.
  function toggleEmployee(
    employee: EmployeeAssignmentCandidate
  ) {
    if (!employee.canAssign) {
      return;
    }

    setSelected((previousSelected) => {
      if (previousSelected[employee.id]) {
        const nextSelected = {
          ...previousSelected
        };

        delete nextSelected[employee.id];

        return nextSelected;
      }

      const initialMonths = employee.alreadyAssignedToSystem
        ? employee.currentSystemMonths
        : Math.min(1, employee.maxAssignableMonths);

      return {
        ...previousSelected,
        [employee.id]: {
          employeeId: employee.id,
          roleInSystem: getDefaultRole(employee),
          plannedMonths: initialMonths,
          actualMonths: initialMonths
        }
      };
    });
  }

  // מעדכן חודשי שיבוץ תוך הגבלה למקסימום שהשרת חישב.
  function updateMonths(
    employee: EmployeeAssignmentCandidate,
    months: number
  ) {
    const fixedMonths = clampMonths(
      months,
      employee.maxAssignableMonths
    );

    setSelected((previousSelected) => {
      const currentSelection =
        previousSelected[employee.id];

      if (!currentSelection) {
        return previousSelected;
      }

      return {
        ...previousSelected,
        [employee.id]: {
          ...currentSelection,
          plannedMonths: fixedMonths,
          actualMonths: fixedMonths
        }
      };
    });
  }

  // שומר את כל הבחירות בפעולה מרוכזת מול השרת.
  async function saveAssignments() {
    if (!system) {
      return;
    }

    const employeesToAssign = Object.values(selected);

    if (employeesToAssign.length === 0) {
      setErrors(["לא נבחרו עובדים לשיבוץ או לעדכון."]);
      return;
    }

    const dto: BulkAssignEmployeesDto = {
      systemId: system.id,
      employees: employeesToAssign
    };

    setSaving(true);
    setErrors([]);

    try {
      const result =
        await assignmentService.bulkAssignEmployees(dto);

      if (!result.isSuccess) {
        logger.warn(
          "Employee assignment completed with errors",
          {
            feature: "systems",
            action: "bulkAssignEmployees",
            entityId: system.id,
            selectedEmployeesCount:
              employeesToAssign.length,
            errorsCount: result.errors?.length ?? 0
          }
        );

        setErrors(
          result.errors?.length
            ? result.errors
            : ["השיבוץ נכשל."]
        );

        return;
      }

      logger.info("Employees assigned to system", {
        feature: "systems",
        action: "bulkAssignEmployees",
        entityId: system.id,
        assignedEmployeesCount:
          result.assignedCount
      });

      await onAssigned();
      onClose();
    } catch (error) {
      logger.error(
        "Failed to assign employees to system",
        error,
        {
          feature: "systems",
          action: "bulkAssignEmployees",
          entityId: system.id,
          selectedEmployeesCount:
            employeesToAssign.length
        }
      );

      const message =
        error instanceof Error
          ? error.message
          : "שגיאה בשמירת השיבוץ.";

      setErrors([message]);
    } finally {
      setSaving(false);
    }
  }

  return {
    selected,
    search,
    loading,
    saving,
    errors,
    visibleEmployees,
    selectedCount,
    setSearch,
    toggleEmployee,
    updateMonths,
    saveAssignments
  };
}