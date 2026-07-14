import { useEffect, useMemo, useState } from "react";

import { assignmentService } from "../../../../services/assignmentService";
import type {
  BulkAssignEmployeesDto,
  EmployeeAssignmentCandidate,
  EmployeeAssignmentItem,
  SystemDetails
} from "../../../../types";

interface UseAssignEmployeesDrawerStateParams {
  open: boolean;
  system: SystemDetails | null;
  year?: number;
  onClose: () => void;
  onAssigned: () => Promise<void> | void;
  getDefaultRole: (employee: EmployeeAssignmentCandidate) => string;
  clampMonths: (value: number, max: number) => number;
  getMaxEditableMonths: (employee: EmployeeAssignmentCandidate) => number;
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
  toggleEmployee: (employee: EmployeeAssignmentCandidate) => void;
  updateMonths: (employee: EmployeeAssignmentCandidate, months: number) => void;
  saveAssignments: () => Promise<void>;
}

export function useAssignEmployeesDrawerState({
  open,
  system,
  year,
  onClose,
  onAssigned,
  getDefaultRole,
  clampMonths,
  getMaxEditableMonths
}: UseAssignEmployeesDrawerStateParams): UseAssignEmployeesDrawerStateResult {
  const [employees, setEmployees] = useState<EmployeeAssignmentCandidate[]>([]);
  const [selected, setSelected] = useState<Record<string, EmployeeAssignmentItem>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // טוען מועמדים לשיבוץ לפי מערכת/שנה/חיפוש עם debounce קצר.
  useEffect(() => {
    if (!open || !system) return;
    const currentSystem = system;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrors([]);

      try {
        const data = await assignmentService.getAssignmentCandidates({
          systemId: currentSystem.id,
          year,
          search: search.trim() || undefined
        });

        if (!cancelled) {
          setEmployees(data);
        }
      } catch (error) {
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

    const timer = window.setTimeout(load, 250);

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
    }
  }, [open]);

  const selectedCount = Object.keys(selected).length;

  // מסנן עובדים מקומית לפי מחרוזת חיפוש.
  const visibleEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;

      return [
        employee.fullName,
        employee.professionalCategory,
        employee.professionalSubCategory,
        employee.managerName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [employees, search]);

  // מוסיף/מסיר עובד מרשימת העובדים שנבחרו לשיבוץ.
  function toggleEmployee(employee: EmployeeAssignmentCandidate) {
    const isBlocked = !employee.canAssign && !employee.alreadyAssignedToSystem;
    if (isBlocked) return;

    setSelected((prev) => {
      if (prev[employee.id]) {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      }

      return {
        ...prev,
        [employee.id]: {
          employeeId: employee.id,
          roleInSystem: getDefaultRole(employee),
          plannedMonths: 1,
          actualMonths: 1
        }
      };
    });
  }

  // מעדכן חודשי שיבוץ לעובד נבחר תוך שמירה על טווח תקין.
  function updateMonths(employee: EmployeeAssignmentCandidate, months: number) {
    const fixedMonths = clampMonths(months, getMaxEditableMonths(employee));

    setSelected((prev) => ({
      ...prev,
      [employee.id]: {
        ...prev[employee.id],
        plannedMonths: fixedMonths,
        actualMonths: fixedMonths
      }
    }));
  }

  // שומר את כל הבחירות בפעולה מרוכזת מול השרת.
  async function saveAssignments() {
    if (!system) return;

    const employeesToAssign = Object.values(selected);

    if (employeesToAssign.length === 0) {
      setErrors(["לא נבחרו עובדים לשיבוץ."]);
      return;
    }

    const dto: BulkAssignEmployeesDto = {
      systemId: system.id,
      employees: employeesToAssign
    };

    setSaving(true);
    setErrors([]);

    try {
      const result = await assignmentService.bulkAssignEmployees(dto);

      if (!result.isSuccess) {
        setErrors(result.errors?.length ? result.errors : ["השיבוץ נכשל."]);
        return;
      }

      await onAssigned();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "שגיאה בשמירת השיבוץ.";
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
