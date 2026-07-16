import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useEmployees } from "./useEmployees";
import { useSystems } from "./useSystems";
import { employeeService } from "../services/employeeService";
import type { EmployeeEvent } from "../types/employeeEvent";
import type { EmployeeListItem, EmployeeUpsertPayload } from "../types";

import { getActiveYear } from "../utils/yearOptions";

// Hook תזמור ברמת עמוד העובדים: חיבור נתונים, פילטרים, מודלים ופעולות משתמש.
export function useEmployeesPage() {
  const activeYear = getActiveYear();

  const [searchParams] = useSearchParams();
  const availabilityFilter = searchParams.get("availability");
  const employeeIdFromUrl = searchParams.get("employeeId");

  // המסך מציג כרגע רק עובדים פעילים.
  const employeesHook = useEmployees({
    year: activeYear,
    isActive: true
  });

  const { systems } = useSystems();

  const {
    employees,
    selectedEmployee,
    loadingList,
    loadingDetails,
    loadingCreate,
    error,
    filters,
    setFilters,
    loadEmployeeDetails,
    setSelectedEmployee,
    createEmployee,
    updateEmployee,
    addAllocation,
    updateActualMonths
  } = employeesHook;

  // אם הגיע מזהה עובד ב-URL, טוען אוטומטית את פרטי העובד לפתיחת פרופיל ישירה.
  useEffect(() => {
    if (!employeeIdFromUrl) {
      return;
    }

    void loadEmployeeDetails(employeeIdFromUrl);
  }, [employeeIdFromUrl, loadEmployeeDetails]);

  const [employeesForFilterOptions, setEmployeesForFilterOptions] =
    useState<EmployeeListItem[]>([]);

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<"create" | "edit">("create");
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationUpdateModalOpen, setAllocationUpdateModalOpen] = useState(false);
  const [employeeEventModalOpen, setEmployeeEventModalOpen] = useState(false);
  const [selectedEmployeeEvent, setSelectedEmployeeEvent] = useState<EmployeeEvent | null>(null);

  const [savingEmployee, setSavingEmployee] =
    useState(false);

  const [savingAllocation, setSavingAllocation] =
    useState(false);

  const [
    savingAllocationUpdate,
    setSavingAllocationUpdate
  ] = useState(false);

  // טוען רשימת עובדים פעילים לבניית אפשרויות פילטור.
  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const data = await employeeService.getEmployees({
          year: filters.year ?? activeYear,
          isActive: true
        });

        if (!cancelled) {
          setEmployeesForFilterOptions(data);
        }
      } catch {
        if (!cancelled) {
          setEmployeesForFilterOptions([]);
        }
      }
    }

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [filters.year, activeYear]);

  // מחיל סינון זמינות שמגיע מה-URL על רשימת העובדים הנוכחית.
  const filteredEmployees = useMemo(() => {
    if (availabilityFilter === "overloaded") {
      return employees.filter(
        (employee) => employee.remainingMonths < 0
      );
    }

    if (availabilityFilter === "low") {
      return employees.filter(
        (employee) => employee.remainingMonths <= 1
      );
    }

    return employees;
  }, [employees, availabilityFilter]);

  // מחשב מדדי תצוגה למסך העובדים לאחר סינון.
  const viewMeta = useMemo(
    () => ({
      total: filteredEmployees.length,
      lowCapacity: filteredEmployees.filter(
        (employee) => employee.remainingMonths <= 1
      ).length,
      overloaded: filteredEmployees.filter(
        (employee) => employee.remainingMonths < 0
      ).length
    }),
    [filteredEmployees]
  );

  // מפיק רשימת קטגוריות ייחודיות וממוינות לבחירה בפילטר.
  const categories = useMemo(
    () =>
      [
        ...new Set(
          employeesForFilterOptions
            .map((employee) =>
              employee.professionalCategory?.trim()
            )
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "he")),
    [employeesForFilterOptions]
  );

  // מפיק רשימת מנהלים ייחודיים וממוינים לבחירה בפילטר.
  const managers = useMemo(
    () =>
      [
        ...new Set(
          employeesForFilterOptions
            .map((employee) =>
              employee.managerName?.trim()
            )
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "he")),
    [employeesForFilterOptions]
  );

  // יוצר אפשרויות לבחירת הקצאה קיימת של העובד הנבחר.
  const allocationOptions = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return selectedEmployee.allocations.map(
      (allocation) => ({
        key: `${allocation.systemId}__${allocation.roleInSystem}`,
        systemId: allocation.systemId,
        roleInSystem: allocation.roleInSystem,
        label: `${allocation.systemName} · ${allocation.roleInSystem}`
      })
    );
  }, [selectedEmployee]);

  // מאפס את הפילטרים לברירת המחדל של המסך.
  function clearFilters() {
    setFilters({
      year: activeYear,
      isActive: true
    });
  }

  // פותח מודל יצירת עובד חדש.
  function openCreateEmployeeModal() {
    setEmployeeModalMode("create");
    setEmployeeModalOpen(true);
  }

  // פותח מודל עריכת עובד עבור העובד הנבחר.
  function openEditEmployeeModal() {
    if (!selectedEmployee) {
      return;
    }

    setEmployeeModalMode("edit");
    setEmployeeModalOpen(true);
  }

  // שומר עובד: יוצר חדש או מעדכן קיים לפי מצב המודל.
  async function handleEmployeeSubmit(
    payload: EmployeeUpsertPayload
  ) {
    setSavingEmployee(true);

    try {
      if (
        employeeModalMode === "edit" &&
        selectedEmployee?.id
      ) {
        await updateEmployee(
          selectedEmployee.id,
          payload
        );
      } else {
        await createEmployee(payload);
      }

      setEmployeeModalOpen(false);
    } finally {
      setSavingEmployee(false);
    }
  }

  // מוסיף הקצאה לעובד הנבחר.
  async function handleAddAllocation(payload: {
    systemId: string;
    roleInSystem: string;
    plannedMonths: number;
    actualMonths: number;
  }) {
    setSavingAllocation(true);

    try {
      await addAllocation(payload);
      setAllocationModalOpen(false);
    } finally {
      setSavingAllocation(false);
    }
  }

  // מעדכן חודשי ביצוע של הקצאה קיימת.
  async function handleUpdateAllocation(
    systemId: string,
    roleInSystem: string,
    actualMonths: number
  ) {
    setSavingAllocationUpdate(true);

    try {
      await updateActualMonths(
        systemId,
        roleInSystem,
        actualMonths
      );

      setAllocationUpdateModalOpen(false);
    } finally {
      setSavingAllocationUpdate(false);
    }
  }

  function openCreateEmployeeEventModal(employeeId: string) {
    if (!selectedEmployee || selectedEmployee.id !== employeeId) {
      return;
    }

    setSelectedEmployeeEvent(null);
    setEmployeeEventModalOpen(true);
  }

  return {
    systems,
    selectedEmployee,
    loadingList,
    loadingDetails,
    loadingCreate,
    error,
    filters,
    setFilters,
    filteredEmployees,
    viewMeta,
    categories,
    managers,
    allocationOptions,
    employeeModalOpen,
    employeeModalMode,
    allocationModalOpen,
    allocationUpdateModalOpen,
    employeeEventModalOpen,
    selectedEmployeeEvent,
    savingEmployee,
    savingAllocation,
    savingAllocationUpdate,
    loadEmployeeDetails,
    setSelectedEmployee,
    setEmployeeModalOpen,
    setAllocationModalOpen,
    setAllocationUpdateModalOpen,
    setEmployeeEventModalOpen,
    setSelectedEmployeeEvent,
    clearFilters,
    openCreateEmployeeModal,
    openEditEmployeeModal,
    openCreateEmployeeEventModal,
    handleEmployeeSubmit,
    handleAddAllocation,
    handleUpdateAllocation
  };
}