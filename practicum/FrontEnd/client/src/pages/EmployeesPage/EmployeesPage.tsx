import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useEmployeesPage } from "../../hooks/useEmployeesPage";

import EmployeeFilters from "../../components/Employees/filters/EmployeeFilters";
import EmployeeBoard from "../../components/Employees/EmployeeBoard";
import EmployeeProfileSection from "../../components/Employees/profile/EmployeeProfileSection";
import EmployeeGroup from "../../components/Employees/groups/EmployeeGroup";
import EmployeeFormModal from "../../components/Employees/modals/EmployeeFormModal";
import AllocationModal from "../../components/Employees/allocations/AllocationModal";
import AllocationUpdateModal from "../../components/Employees/allocations/AllocationUpdateModal";
import EmployeeEventFormModal from "../../components/Employees/events/EmployeeEventFormModal";
import { useEmployeeEvents } from "../../hooks/useEmployeeEvents";
import type { EmployeeDetails, EmployeeEventCreatePayload } from "../../types";

import "./EmployeesPage.css";

type EmployeeViewMode = "all" | "status" | "category";

function getVisibleEmployees(
  page: ReturnType<typeof useEmployeesPage>
) {
  return page.selectedEmployee
    ? page.filteredEmployees.filter(
        (employee) =>
          employee.id !== page.selectedEmployee?.id
      )
    : page.filteredEmployees;
}

function getStatusGroups(
  employees: ReturnType<typeof getVisibleEmployees>
) {
  return {
    available: employees.filter(
      (employee) => employee.remainingMonths > 0
    ),
    balanced: employees.filter(
      (employee) => employee.remainingMonths === 0
    ),
    overloaded: employees.filter(
      (employee) => employee.remainingMonths < 0
    )
  };
}

function getCategoryGroups(
  employees: ReturnType<typeof getVisibleEmployees>
) {
  const groups = new Map<
    string,
    {
      title: string;
      subtitle: string;
      employees: typeof employees;
    }
  >();

  employees.forEach((employee) => {
    const category =
      employee.professionalCategory?.trim() ||
      "לא מוגדר";

    const subCategory =
      employee.professionalSubCategory?.trim();

    const groupKey = category;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        title: category,
        subtitle: "",
        employees: []
      });
    }

    const group = groups.get(groupKey);

    if (group) {
      group.employees.push(employee);

      if (subCategory && !group.subtitle) {
        const subCategories = new Set(
          employees
            .filter(
              (item) =>
                (item.professionalCategory?.trim() ||
                  "לא מוגדר") === category
            )
            .map((item) =>
              item.professionalSubCategory?.trim()
            )
            .filter(
              (item): item is string =>
                Boolean(item)
            )
        );

        group.subtitle =
          subCategories.size > 0
            ? `תתי תחומים: ${[
                ...subCategories
              ]
                .slice(0, 3)
                .join(", ")}${
                subCategories.size > 3 ? "..." : ""
              }`
            : subCategory;
      }
    }
  });

  return [...groups.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "he")
  );
}

// עמוד עובדים: מציג רשימה, פרופיל, פילטרים ומודלים לפעולות ניהול.
export default function EmployeesPage() {
  const page = useEmployeesPage();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("all");
  const {
    createEvent,
    updateEvent
  } = useEmployeeEvents(page.selectedEmployee?.id ?? null);
  const [savingEmployeeEvent, setSavingEmployeeEvent] = useState(false);

  useEffect(() => {
    const requestedView =
      searchParams.get("view");

    if (
      requestedView === "status" ||
      requestedView === "category" ||
      requestedView === "all"
    ) {
      setViewMode(requestedView);
    }

    const requestedCategory = searchParams
      .get("professionalCategory")
      ?.trim();

    if (requestedCategory) {
      page.setFilters((previousFilters) => ({
        ...previousFilters,
        professionalCategory: requestedCategory
      }));
    }
  }, [searchParams, page.setFilters]);

  const visibleEmployees = useMemo(
    () => getVisibleEmployees(page),
    [page]
  );

  const statusGroups = useMemo(
    () => getStatusGroups(visibleEmployees),
    [visibleEmployees]
  );

  const categoryGroups = useMemo(
    () => getCategoryGroups(visibleEmployees),
    [visibleEmployees]
  );

  const employeeSummary = useMemo(
    () => ({
      available: page.filteredEmployees.filter(
        (employee) =>
          employee.remainingMonths > 0
      ).length,

      balanced: page.filteredEmployees.filter(
        (employee) =>
          employee.remainingMonths === 0
      ).length,

      overloaded: page.filteredEmployees.filter(
        (employee) =>
          employee.remainingMonths < 0
      ).length
    }),
    [page.filteredEmployees]
  );

  async function handleEmployeeEventSubmit(payload: EmployeeEventCreatePayload) {
    if (!page.selectedEmployee?.id) {
      return;
    }

    setSavingEmployeeEvent(true);
    try {
      if (page.selectedEmployeeEvent?.id) {
        await updateEvent(page.selectedEmployeeEvent.id, payload);
      } else {
        await createEvent(payload);
      }

      setSelectedEmployeeEvent(null);
      setEmployeeEventModalOpen(false);
    } finally {
      setSavingEmployeeEvent(false);
    }
  }

  function handleManageAvailability(employee: EmployeeDetails) {
    page.openCreateEmployeeEventModal(employee.id);
  }

  const { setEmployeeEventModalOpen, setSelectedEmployeeEvent } = page;

  return (
    <main
      className="employees-page-shell"
      dir="rtl"
    >
      <EmployeeFilters
        filters={page.filters}
        categories={page.categories}
        managers={page.managers}
        viewMode={viewMode}
        available={employeeSummary.available}
        balanced={employeeSummary.balanced}
        overloaded={employeeSummary.overloaded}
        onChangeFilters={page.setFilters}
        onChangeViewMode={setViewMode}
        onCreateEmployee={
          page.openCreateEmployeeModal
        }
        onClearFilters={page.clearFilters}
      />

      {page.error && (
        <div className="error-box">
          {page.error}
        </div>
      )}

      {page.selectedEmployee && (
        <EmployeeProfileSection
          employee={page.selectedEmployee}
          loading={page.loadingDetails}
          allocationOptionsCount={
            page.allocationOptions.length
          }
          onClose={() =>
            page.setSelectedEmployee(null)
          }
          onEdit={page.openEditEmployeeModal}
          onAddAllocation={() =>
            page.setAllocationModalOpen(true)
          }
          onUpdateAllocation={() =>
            page.setAllocationUpdateModalOpen(true)
          }
        />
      )}

      {viewMode === "all" && (
        <EmployeeBoard
          employees={page.filteredEmployees}
          selectedEmployee={
            page.selectedEmployee
          }
          loading={page.loadingList}
          lowCapacity={page.viewMeta.lowCapacity}
          onSelectEmployee={
            page.loadEmployeeDetails
          }
        />
      )}

      {!page.loadingList &&
        viewMode === "status" && (
          <section className="employees-board grouped-board">
            <header className="employees-board-header">
              <div>
                <h2>
                  קיבוץ עובדים לפי זמינות
                </h2>

                <p>
                  {visibleEmployees.length} עובדים
                  מוצגים כעת
                </p>
              </div>
            </header>

            <div className="employees-groups-stack">
              <EmployeeGroup
                title="זמינים"
                tone="available"
                employees={
                  statusGroups.available
                }
                selectedEmployeeId={
                  page.selectedEmployee?.id
                }
                onSelectEmployee={
                  page.loadEmployeeDetails
                }
              />

              <EmployeeGroup
                title="מלאים"
                tone="balanced"
                employees={
                  statusGroups.balanced
                }
                selectedEmployeeId={
                  page.selectedEmployee?.id
                }
                onSelectEmployee={
                  page.loadEmployeeDetails
                }
              />

              <EmployeeGroup
                title="עומס יתר"
                tone="overloaded"
                employees={
                  statusGroups.overloaded
                }
                selectedEmployeeId={
                  page.selectedEmployee?.id
                }
                onSelectEmployee={
                  page.loadEmployeeDetails
                }
              />
            </div>
          </section>
        )}

      {!page.loadingList &&
        viewMode === "category" && (
          <section className="employees-board grouped-board">
            <header className="employees-board-header">
              <div>
                <h2>
                  קיבוץ עובדים לפי קטגוריה
                </h2>

                <p>
                  {visibleEmployees.length} עובדים
                  מוצגים כעת
                </p>
              </div>
            </header>

            <div className="employees-groups-stack category-groups-stack">
              {categoryGroups.map((group) => (
                <EmployeeGroup
                  key={group.title}
                  title={group.title}
                  subtitle={group.subtitle}
                  tone="available"
                  employees={group.employees}
                  selectedEmployeeId={
                    page.selectedEmployee?.id
                  }
                  onSelectEmployee={
                    page.loadEmployeeDetails
                  }
                />
              ))}
            </div>
          </section>
        )}

      {page.loadingList && (
        <div className="system-note-box">
          טוען עובדים...
        </div>
      )}

      <AllocationModal
        open={page.allocationModalOpen}
        systems={page.systems}
        saving={page.savingAllocation}
        onClose={() =>
          page.setAllocationModalOpen(false)
        }
        onSubmit={page.handleAddAllocation}
      />

      <EmployeeFormModal
        open={page.employeeModalOpen}
        mode={page.employeeModalMode}
        employee={page.selectedEmployee}
        saving={page.savingEmployee || page.loadingCreate}
        onClose={() => page.setEmployeeModalOpen(false)}
        onManageAvailability={handleManageAvailability}
        onSubmit={page.handleEmployeeSubmit}
      />

      {page.selectedEmployee && (
        <EmployeeEventFormModal
          open={page.employeeEventModalOpen}
          employeeId={page.selectedEmployee.id}
          event={page.selectedEmployeeEvent}
          saving={savingEmployeeEvent}
          onClose={() => {
            if (savingEmployeeEvent) return;
            setSelectedEmployeeEvent(null);
            setEmployeeEventModalOpen(false);
          }}
          onSubmit={handleEmployeeEventSubmit}
        />
      )}

      <AllocationUpdateModal
        open={
          page.allocationUpdateModalOpen
        }
        options={page.allocationOptions}
        saving={
          page.savingAllocationUpdate
        }
        onClose={() =>
          page.setAllocationUpdateModalOpen(
            false
          )
        }
        onSubmit={
          page.handleUpdateAllocation
        }
      />
    </main>
  );
}