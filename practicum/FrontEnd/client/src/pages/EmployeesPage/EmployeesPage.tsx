import {
  useEffect,
  useMemo,
  useState
} from "react";
import { useSearchParams } from "react-router-dom";

import { useEmployeesPage } from "../../hooks/useEmployeesPage";
import { useEmployeeEvents } from "../../hooks/useEmployeeEvents";

import { getCategoryColor } from "../../constants/categoryColors";

import EmployeeFilters from "../../components/Employees/filters/EmployeeFilters";
import EmployeeBoard from "../../components/Employees/EmployeeBoard";
import EmployeeProfileSection from "../../components/Employees/profile/EmployeeProfileSection";
import EmployeeGroup from "../../components/Employees/groups/EmployeeGroup";
import EmployeeFormModal from "../../components/Employees/modals/EmployeeFormModal";
import AllocationModal from "../../components/Employees/allocations/AllocationModal";
import AllocationUpdateModal from "../../components/Employees/allocations/AllocationUpdateModal";
import EmployeeEventFormModal from "../../components/Employees/events/EmployeeEventFormModal";

import type {
  EmployeeDetails,
  EmployeeEventCreatePayload
} from "../../types";

import "./EmployeesPage.css";

type EmployeeViewMode =
  | "all"
  | "status"
  | "category";

function getVisibleEmployees(
  page: ReturnType<typeof useEmployeesPage>
) {
  return page.selectedEmployee
    ? page.filteredEmployees.filter(
        (employee) =>
          employee.id !==
          page.selectedEmployee?.id
      )
    : page.filteredEmployees;
}

function getStatusGroups(
  employees: ReturnType<
    typeof getVisibleEmployees
  >
) {
  return {
    available: employees.filter(
      (employee) =>
        employee.remainingMonths > 0
    ),

    balanced: employees.filter(
      (employee) =>
        employee.remainingMonths === 0
    ),

    overloaded: employees.filter(
      (employee) =>
        employee.remainingMonths < 0
    )
  };
}

function getCategoryGroups(
  employees: ReturnType<
    typeof getVisibleEmployees
  >
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

    if (!groups.has(category)) {
      groups.set(category, {
        title: category,
        subtitle: "",
        employees: []
      });
    }

    const group = groups.get(category);

    if (group) {
      group.employees.push(employee);

      if (
        subCategory &&
        !group.subtitle
      ) {
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
                subCategories.size > 3
                  ? "..."
                  : ""
              }`
            : subCategory;
      }
    }
  });

  return [...groups.values()].sort(
    (firstGroup, secondGroup) =>
      firstGroup.title.localeCompare(
        secondGroup.title,
        "he"
      )
  );
}

// עמוד עובדים: מציג רשימה, פרופיל,
// פילטרים ומודלים לפעולות ניהול.
export default function EmployeesPage() {
  const page = useEmployeesPage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] =
    useState<EmployeeViewMode>("all");

  const {
    createEvent,
    updateEvent
  } = useEmployeeEvents(
    page.selectedEmployee?.id ?? null
  );

  const [
    savingEmployeeEvent,
    setSavingEmployeeEvent
  ] = useState(false);

  const {
    setEmployeeEventModalOpen,
    setSelectedEmployeeEvent
  } = page;

  const requestedCategory =
    page.professionalCategoryFromUrl;

  const requestedView =
    searchParams.get("view");

  useEffect(() => {
    if (
      requestedView === "status" ||
      requestedView === "category" ||
      requestedView === "all"
    ) {
      setViewMode(requestedView);
    }
  }, [requestedView]);

  const visibleEmployees = useMemo(
    () => getVisibleEmployees(page),
    [page]
  );

  const categoryVisibleEmployees = useMemo(
    () =>
      page.selectedEmployee
        ? page.categoryViewEmployees.filter(
            (employee) =>
              employee.id !==
              page.selectedEmployee?.id
          )
        : page.categoryViewEmployees,
    [
      page.categoryViewEmployees,
      page.selectedEmployee
    ]
  );

  const statusGroups = useMemo(
    () => getStatusGroups(visibleEmployees),
    [visibleEmployees]
  );

  const categoryGroups = useMemo(
    () =>
      getCategoryGroups(
        categoryVisibleEmployees
      ),
    [categoryVisibleEmployees]
  );

  const summaryEmployees =
    viewMode === "status"
      ? page.filteredEmployees
      : page.categoryViewEmployees;

  const employeeSummary = useMemo(
    () => ({
      available:
        summaryEmployees.filter(
          (employee) =>
            employee.remainingMonths > 0
        ).length,

      balanced:
        summaryEmployees.filter(
          (employee) =>
            employee.remainingMonths === 0
        ).length,

      overloaded:
        summaryEmployees.filter(
          (employee) =>
            employee.remainingMonths < 0
        ).length
    }),
    [summaryEmployees]
  );

  const allEmployeesMeta = useMemo(
    () => ({
      lowCapacity:
        page.categoryViewEmployees.filter(
          (employee) =>
            employee.remainingMonths <= 1
        ).length
    }),
    [page.categoryViewEmployees]
  );

  async function handleEmployeeEventSubmit(
    payload: EmployeeEventCreatePayload
  ) {
    if (!page.selectedEmployee?.id) {
      return;
    }

    setSavingEmployeeEvent(true);

    try {
      if (
        page.selectedEmployeeEvent?.id
      ) {
        await updateEvent(
          page.selectedEmployeeEvent.id,
          payload
        );
      } else {
        await createEvent(payload);
      }

      setSelectedEmployeeEvent(null);
      setEmployeeEventModalOpen(false);
    } finally {
      setSavingEmployeeEvent(false);
    }
  }

  function handleManageAvailability(
    employee: EmployeeDetails
  ) {
    page.openCreateEmployeeEventModal(
      employee.id
    );
  }

  // מסיר פרמטרים של ניווט התחלתי מהדשבורד,
  // לאחר שהמשתמשת מתחילה לעבוד ידנית במסך העובדים.
  function clearDashboardNavigationParams(
    options: {
      category?: boolean;
      availability?: boolean;
    } = {}
  ) {
    const nextSearchParams =
      new URLSearchParams(searchParams);

    if (options.category) {
      nextSearchParams.delete(
        "professionalCategory"
      );
    }

    if (options.availability) {
      nextSearchParams.delete(
        "availability"
      );
    }

    setSearchParams(nextSearchParams, {
      replace: true
    });
  }

  // שינוי פילטר ידני מבטל את קטגוריית הכניסה מהדשבורד.
  // לאחר מכן הפילטר המקומי הוא מקור האמת היחיד.
  function handleChangeFilters(
    update: Parameters<
      typeof page.setFilters
    >[0]
  ) {
    const nextFilters =
      typeof update === "function"
        ? update(page.filters)
        : update;

    page.setFilters(nextFilters);

    if (requestedCategory) {
      clearDashboardNavigationParams({
        category: true
      });
    }
  }

  // מעבר בין צורות התצוגה שומר את קטגוריית
  // הכניסה מהדשבורד:
  // בתצוגת קטגוריות היא רק פותחת את הקבוצה המתאימה,
  // ובתצוגת זמינות היא ממשיכה לסנן לאותה קטגוריה.
  function handleChangeViewMode(
    mode: EmployeeViewMode
  ) {
    setViewMode(mode);
  }

  // ניקוי מלא מאפס גם את פילטרי הכניסה שהגיעו מהדשבורד.
  function handleClearFilters() {
    page.clearFilters();

    clearDashboardNavigationParams({
      category: true,
      availability: true
    });
  }

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
        onChangeFilters={
          handleChangeFilters
        }
        onChangeViewMode={
          handleChangeViewMode
        }
        onCreateEmployee={
          page.openCreateEmployeeModal
        }
        onClearFilters={
          handleClearFilters
        }
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
          onEdit={
            page.openEditEmployeeModal
          }
          onAddAllocation={() =>
            page.setAllocationModalOpen(true)
          }
          onUpdateAllocation={() =>
            page.setAllocationUpdateModalOpen(
              true
            )
          }
        />
      )}

      {viewMode === "all" && (
        <EmployeeBoard
          employees={page.categoryViewEmployees}
          selectedEmployee={
            page.selectedEmployee
          }
          loading={page.loadingList}
          lowCapacity={
            allEmployeesMeta.lowCapacity
          }
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
                  {categoryVisibleEmployees.length} עובדים
                  מוצגים כעת
                </p>
              </div>
            </header>

            <div className="employees-groups-stack category-groups-stack">
              {categoryGroups.map(
                (group) => {
                  const isRequestedCategory =
                    Boolean(
                      requestedCategory &&
                        group.title ===
                          requestedCategory
                    );

                  return (
                    <EmployeeGroup
                      key={`${group.title}-${
                        requestedCategory ||
                        "all"
                      }`}
                      title={group.title}
                      subtitle={group.subtitle}
                      tone="category"
                      accentColor={getCategoryColor(
                        group.title
                      )}
                      employees={
                        group.employees
                      }
                      selectedEmployeeId={
                        page.selectedEmployee?.id
                      }
                      defaultOpen={
                        isRequestedCategory
                      }
                      onSelectEmployee={
                        page.loadEmployeeDetails
                      }
                    />
                  );
                }
              )}
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
        saving={
          page.savingEmployee ||
          page.loadingCreate
        }
        onClose={() =>
          page.setEmployeeModalOpen(false)
        }
        onManageAvailability={
          handleManageAvailability
        }
        onSubmit={
          page.handleEmployeeSubmit
        }
      />

      {page.selectedEmployee && (
        <EmployeeEventFormModal
          open={
            page.employeeEventModalOpen
          }
          employeeId={
            page.selectedEmployee.id
          }
          event={
            page.selectedEmployeeEvent
          }
          saving={
            savingEmployeeEvent
          }
          onClose={() => {
            if (savingEmployeeEvent) {
              return;
            }

            setSelectedEmployeeEvent(null);
            setEmployeeEventModalOpen(false);
          }}
          onSubmit={
            handleEmployeeEventSubmit
          }
        />
      )}

      <AllocationUpdateModal
        open={
          page.allocationUpdateModalOpen
        }
        options={
          page.allocationOptions
        }
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