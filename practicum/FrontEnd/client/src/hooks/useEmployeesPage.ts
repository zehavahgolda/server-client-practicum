import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmployees } from "./useEmployees";
import { useSystems } from "./useSystems";
import { employeeService } from "../services/employeeService";
import type { EmployeeListItem, EmployeeUpsertPayload } from "../types";

export function useEmployeesPage() {
  const [searchParams] = useSearchParams();
  const availabilityFilter = searchParams.get("availability");
  const employeeIdFromUrl = searchParams.get("employeeId");
  const profileRef = useRef<HTMLDivElement | null>(null);

  const employeesHook = useEmployees({ year: 2026 });
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
  useEffect(() => {
  if (!employeeIdFromUrl) return;

  void loadEmployeeDetails(employeeIdFromUrl);
}, [employeeIdFromUrl, loadEmployeeDetails]);
  

  const [employeesForFilterOptions, setEmployeesForFilterOptions] = useState<EmployeeListItem[]>([]);

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<"create" | "edit">("create");
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationUpdateModalOpen, setAllocationUpdateModalOpen] = useState(false);

  const [savingEmployee, setSavingEmployee] = useState(false);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [savingAllocationUpdate, setSavingAllocationUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      const data = await employeeService.getEmployees({
        year: filters.year ?? 2026
      });

      if (!cancelled) {
        setEmployeesForFilterOptions(data);
      }
    }

    loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [filters.year]);

  const filteredEmployees = useMemo(() => {
    if (availabilityFilter === "overloaded") {
      return employees.filter((employee) => employee.remainingMonths < 0);
    }

    if (availabilityFilter === "low") {
      return employees.filter((employee) => employee.remainingMonths <= 1);
    }

    return employees;
  }, [employees, availabilityFilter]);

  const viewMeta = useMemo(
    () => ({
      total: filteredEmployees.length,
      lowCapacity: filteredEmployees.filter((employee) => employee.remainingMonths <= 1).length,
      overloaded: filteredEmployees.filter((employee) => employee.remainingMonths < 0).length
    }),
    [filteredEmployees]
  );

  const categories = useMemo(
    () =>
      [
        ...new Set(
          employeesForFilterOptions
            .map((employee) => employee.professionalCategory?.trim())
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "he")),
    [employeesForFilterOptions]
  );

  const managers = useMemo(
    () =>
      [
        ...new Set(
          employeesForFilterOptions
            .map((employee) => employee.managerName?.trim())
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "he")),
    [employeesForFilterOptions]
  );

  const allocationOptions = useMemo(() => {
    if (!selectedEmployee) return [];

    return selectedEmployee.allocations.map((allocation) => ({
      key: `${allocation.systemId}__${allocation.roleInSystem}`,
      systemId: allocation.systemId,
      roleInSystem: allocation.roleInSystem,
      label: `${allocation.systemName} · ${allocation.roleInSystem}`
    }));
  }, [selectedEmployee]);

  useEffect(() => {
    if (!selectedEmployee) return;

    requestAnimationFrame(() => {
      profileRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }, [selectedEmployee?.id]);

  function clearFilters() {
    setFilters({ year: 2026 });
  }

  function openCreateEmployeeModal() {
    setEmployeeModalMode("create");
    setEmployeeModalOpen(true);
  }

  function openEditEmployeeModal() {
    if (!selectedEmployee) return;
    setEmployeeModalMode("edit");
    setEmployeeModalOpen(true);
  }

  async function handleEmployeeSubmit(payload: EmployeeUpsertPayload) {
    setSavingEmployee(true);

    try {
      if (employeeModalMode === "edit" && selectedEmployee?.id) {
        await updateEmployee(selectedEmployee.id, payload);
      } else {
        await createEmployee(payload);
      }

      setEmployeeModalOpen(false);
    } finally {
      setSavingEmployee(false);
    }
  }

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

  async function handleUpdateAllocation(systemId: string, roleInSystem: string, actualMonths: number) {
    setSavingAllocationUpdate(true);

    try {
      await updateActualMonths(systemId, roleInSystem, actualMonths);
      setAllocationUpdateModalOpen(false);
    } finally {
      setSavingAllocationUpdate(false);
    }
  }

  return {
    profileRef,
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
    savingEmployee,
    savingAllocation,
    savingAllocationUpdate,
    loadEmployeeDetails,
    setSelectedEmployee,
    setEmployeeModalOpen,
    setAllocationModalOpen,
    setAllocationUpdateModalOpen,
    clearFilters,
    openCreateEmployeeModal,
    openEditEmployeeModal,
    handleEmployeeSubmit,
    handleAddAllocation,
    handleUpdateAllocation
  };
}