import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmployees } from "../hooks/useEmployees";
import { useSystems } from "../hooks/useSystems";

type EmployeeFormState = {
  fullName: string;
  professionalCategory: string;
  professionalSubCategory: string;
  managerName: string;
  year: string;
  yearlyCapacityMonths: string;
  upcomingEvent: string;
  notes: string;
  managerReviewNote: string;
};

const emptyEmployeeForm: EmployeeFormState = {
  fullName: "",
  professionalCategory: "",
  professionalSubCategory: "",
  managerName: "",
  year: "2026",
  yearlyCapacityMonths: "12",
  upcomingEvent: "",
  notes: "",
  managerReviewNote: ""
};

const MAX_MONTHS = 12;

function clampMonthsInput(value: string): string {
  if (value === "") {
    return "";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "";
  }

  if (numericValue < 0) {
    return "0";
  }

  if (numericValue > MAX_MONTHS) {
    return String(MAX_MONTHS);
  }

  return value;
}

export default function EmployeesPage() {
  const [searchParams] = useSearchParams();
  const availabilityFilter = searchParams.get("availability");
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
    createEmployee,
    updateEmployee,
    addAllocation,
    updateActualMonths
  } = useEmployees({ year: 2026 });

  const { systems } = useSystems();

  const [employeeFormState, setEmployeeFormState] = useState<EmployeeFormState>(emptyEmployeeForm);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<"create" | "edit">("create");
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (availabilityFilter === "overloaded") {
      return employees.filter((emp) => emp.remainingMonths < 0);
    }

    if (availabilityFilter === "low") {
      return employees.filter((emp) => emp.remainingMonths <= 1);
    }

    return employees;
  }, [employees, availabilityFilter]);

  const viewMeta = useMemo(
    () => ({
      total: filteredEmployees.length,
      lowCapacity: filteredEmployees.filter((emp) => emp.remainingMonths <= 1).length,
      overloaded: filteredEmployees.filter((emp) => emp.remainingMonths < 0).length
    }),
    [filteredEmployees]
  );

  const getEmployeeTone = (remainingMonths: number) => {
    if (remainingMonths < 0) {
      return "shortage";
    }

    if (remainingMonths === 0) {
      return "balanced";
    }

    return "surplus";
  };

  const getEmployeeToneLabel = (remainingMonths: number) => {
    if (remainingMonths < 0) {
      return "חסר";
    }

    if (remainingMonths === 0) {
      return "מאוזן";
    }

    return "עודף";
  };

  const [formState, setFormState] = useState({
    selectedAllocationKey: "",
    actualMonths: ""
  });

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [newAllocationState, setNewAllocationState] = useState({
    systemId: "",
    roleInSystem: "",
    plannedMonths: "",
    actualMonths: "0"
  });
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  const [isAllocationUpdateModalOpen, setIsAllocationUpdateModalOpen] = useState(false);
  const [isSavingAllocationUpdate, setIsSavingAllocationUpdate] = useState(false);

  const allocationOptions = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return selectedEmployee.allocations.map((allocation) => ({
      key: `${allocation.systemId}__${allocation.roleInSystem}`,
      systemId: allocation.systemId,
      roleInSystem: allocation.roleInSystem,
      label: `${allocation.systemName} · ${allocation.roleInSystem}`
    }));
  }, [selectedEmployee]);

  const categories = useMemo(
    () =>
      [...new Set(filteredEmployees.map((emp) => emp.professionalCategory.trim()).filter((value) => value.length > 0))].sort((a, b) =>
        a.localeCompare(b, "he")
      ),
    [filteredEmployees]
  );

  const managers = useMemo(
    () =>
      [...new Set(filteredEmployees.map((emp) => emp.managerName.trim()).filter((value) => value.length > 0))].sort((a, b) =>
        a.localeCompare(b, "he")
      ),
    [filteredEmployees]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.selectedAllocationKey) {
      return;
    }

    const selectedAllocation = allocationOptions.find((option) => option.key === formState.selectedAllocationKey);
    if (!selectedAllocation) {
      return;
    }

    const actualMonths = Number(formState.actualMonths);
    if (Number.isNaN(actualMonths) || actualMonths > MAX_MONTHS || actualMonths < 0) {
      return;
    }

    setIsSavingAllocationUpdate(true);
    try {
      await updateActualMonths(selectedAllocation.systemId, selectedAllocation.roleInSystem, actualMonths);
      setFormState({ selectedAllocationKey: "", actualMonths: "" });
      setIsAllocationUpdateModalOpen(false);
    } finally {
      setIsSavingAllocationUpdate(false);
    }
  };

  const openAllocationUpdateModal = () => {
    setFormState({ selectedAllocationKey: "", actualMonths: "" });
    setIsAllocationUpdateModalOpen(true);
  };

  const handleAddAllocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newAllocationState.systemId || !newAllocationState.roleInSystem.trim()) {
      return;
    }

    const plannedMonths = Number(newAllocationState.plannedMonths);
    const actualMonths = Number(newAllocationState.actualMonths);

    if (
      Number.isNaN(plannedMonths) ||
      Number.isNaN(actualMonths) ||
      plannedMonths > MAX_MONTHS ||
      actualMonths > MAX_MONTHS ||
      plannedMonths < 0 ||
      actualMonths < 0
    ) {
      return;
    }

    setIsSavingAllocation(true);
    try {
      await addAllocation({
        systemId: newAllocationState.systemId,
        roleInSystem: newAllocationState.roleInSystem.trim(),
        plannedMonths,
        actualMonths
      });

      setNewAllocationState({
        systemId: "",
        roleInSystem: "",
        plannedMonths: "",
        actualMonths: "0"
      });
      setIsAllocationModalOpen(false);
    } finally {
      setIsSavingAllocation(false);
    }
  };

  const openAllocationModal = () => {
    setNewAllocationState({
      systemId: "",
      roleInSystem: "",
      plannedMonths: "",
      actualMonths: "0"
    });
    setIsAllocationModalOpen(true);
  };

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = employeeFormState.fullName.trim();
    const professionalCategory = employeeFormState.professionalCategory.trim();
    const managerName = employeeFormState.managerName.trim();
    const year = Number(employeeFormState.year);
    const yearlyCapacityMonths = Number(employeeFormState.yearlyCapacityMonths);

    if (!fullName || !professionalCategory || !managerName) {
      return;
    }

    if (Number.isNaN(year) || Number.isNaN(yearlyCapacityMonths) || yearlyCapacityMonths > MAX_MONTHS || yearlyCapacityMonths < 0) {
      return;
    }

    setIsSavingEmployee(true);
    try {
      const payload = {
        fullName,
        professionalCategory,
        professionalSubCategory: employeeFormState.professionalSubCategory.trim() || undefined,
        managerName,
        year,
        yearlyCapacityMonths,
        upcomingEvent: employeeFormState.upcomingEvent.trim() || undefined,
        notes: employeeFormState.notes.trim() || undefined,
        managerReviewNote: employeeFormState.managerReviewNote.trim() || undefined
      };

      if (employeeModalMode === "edit" && selectedEmployee?.id) {
        await updateEmployee(selectedEmployee.id, payload);
      } else {
        await createEmployee(payload);
      }

      setEmployeeFormState(emptyEmployeeForm);
      setIsEmployeeModalOpen(false);
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const openCreateEmployeeModal = () => {
    setEmployeeModalMode("create");
    setEmployeeFormState(emptyEmployeeForm);
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = () => {
    if (!selectedEmployee) {
      return;
    }

    setEmployeeModalMode("edit");
    setEmployeeFormState({
      fullName: selectedEmployee.fullName ?? "",
      professionalCategory: selectedEmployee.professionalCategory ?? "",
      professionalSubCategory: selectedEmployee.professionalSubCategory ?? "",
      managerName: selectedEmployee.managerName ?? "",
      year: String(selectedEmployee.year ?? 2026),
      yearlyCapacityMonths: String(selectedEmployee.yearlyCapacityMonths ?? 12),
      upcomingEvent: selectedEmployee.upcomingEvent ?? "",
      notes: selectedEmployee.notes ?? "",
      managerReviewNote: selectedEmployee.managerReviewNote ?? ""
    });
    setIsEmployeeModalOpen(true);
  };

  const plannedAllocationTotalInEdit = useMemo(() => {
    if (employeeModalMode !== "edit" || !selectedEmployee) {
      return 0;
    }

    return selectedEmployee.allocations.reduce((total, allocation) => total + allocation.plannedMonths, 0);
  }, [employeeModalMode, selectedEmployee]);

  const editCapacityMonths = Number(employeeFormState.yearlyCapacityMonths) || 0;
  const isPlannedOverCapacity = employeeModalMode === "edit" && plannedAllocationTotalInEdit > editCapacityMonths;

  return (
    <main className="app-shell" dir="rtl">
      <header className="app-header">
        <h1>ניהול עובדים - חיבור לשרת</h1>
        <p>Vertical Slice ראשון: רשימה, פרטי עובד ועדכון חודשי הקצאה בפועל.</p>
      </header>

      <section className="toolbar">
        <label>
          חיפוש
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="שם עובד, מנהל או קטגוריה"
          />
        </label>

        <label>
          קטגוריה
          <select
            value={filters.professionalCategory ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                professionalCategory: e.target.value || undefined
              }))
            }
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          מנהל
          <select
            value={filters.managerName ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                managerName: e.target.value || undefined
              }))
            }
          >
            <option value="">כל המנהלים</option>
            {managers.map((manager) => (
              <option key={manager} value={manager}>
                {manager}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar-stats">
          <span className="stat-neutral">סה"כ: {viewMeta.total}</span>
          <span className="stat-danger">בלחץ: {viewMeta.lowCapacity}</span>
          <span className="stat-danger">עומס יתר: {viewMeta.overloaded}</span>
        </div>

        <button
          type="button"
          className="primary-btn toolbar-add-btn"
          onClick={() => {
            openCreateEmployeeModal();
          }}
        >
          + הוספת עובד
        </button>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="layout">
        <article className="panel list-panel">
          <h2>עובדים</h2>
          {loadingList ? <p>טוען עובדים...</p> : null}

          <div className="employees-list">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                className={`employee-row ${getEmployeeTone(employee.remainingMonths)} ${selectedEmployee?.id === employee.id ? "selected" : ""}`}
                onClick={() => {
                  loadEmployeeDetails(employee.id);
                }}
                style={{
                  borderRightColor:
                    employee.remainingMonths < 0
                      ? "var(--status-danger)"
                      : employee.remainingMonths === 0
                        ? "var(--status-success)"
                        : "var(--status-surplus)"
                }}
              >
                <div className="employee-main">
                  <strong>{employee.fullName}</strong>
                  <small>
                    {employee.professionalSubCategory || employee.professionalCategory} · מנהל: {employee.managerName}
                  </small>
                </div>
                <div className="employee-metrics">
                  <span>קיבולת {employee.yearlyCapacityMonths}</span>
                  <span>מנוצל {employee.allocatedMonths}</span>
                  <span className={employee.remainingMonths < 0 ? "danger" : employee.remainingMonths <= 1 ? "warn" : "ok"}>
                    יתרה {employee.remainingMonths}
                  </span>
                </div>
                <span className={`status-chip ${getEmployeeTone(employee.remainingMonths)}`}>
                  {getEmployeeToneLabel(employee.remainingMonths)}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel details-panel">
          <h2>פרטי עובד</h2>
          {!selectedEmployee && <p>בחר עובד להצגת פרטים או לחץ על "הוספת עובד".</p>}
          {loadingDetails ? <p>טוען פרטים...</p> : null}

          {selectedEmployee && !loadingDetails && (
            <>
              <div className="detail-head">
                <h3>{selectedEmployee.fullName}</h3>
                <p>
                  {selectedEmployee.professionalCategory} · {selectedEmployee.professionalSubCategory || "-"}
                </p>
                <p>
                  סטטוס זמינות: {selectedEmployee.availabilityStatus}{" "}
                  <span className={`status-chip ${getEmployeeTone(selectedEmployee.remainingMonths)}`}>
                    {getEmployeeToneLabel(selectedEmployee.remainingMonths)}
                  </span>
                </p>
              </div>

              <div className="employee-readonly-grid">
                <div className="readonly-item">
                  <span className="readonly-label">מנהל</span>
                  <strong>{selectedEmployee.managerName || "-"}</strong>
                </div>
                <div className="readonly-item">
                  <span className="readonly-label">שנה</span>
                  <strong>{selectedEmployee.year}</strong>
                </div>
                <div className="readonly-item">
                  <span className="readonly-label">קיבולת שנתית</span>
                  <strong>{selectedEmployee.yearlyCapacityMonths}</strong>
                </div>
                <div className="readonly-item">
                  <span className="readonly-label">אירוע עתידי</span>
                  <strong>{selectedEmployee.upcomingEvent || "אין"}</strong>
                </div>
                <div className="readonly-item">
                  <span className="readonly-label">הערות</span>
                  <strong>{selectedEmployee.notes || "אין"}</strong>
                </div>
                <div className="readonly-item">
                  <span className="readonly-label">הערת מנהל</span>
                  <strong>{selectedEmployee.managerReviewNote || "אין"}</strong>
                </div>
              </div>

              <h4>הקצאות פעילות</h4>
              <div className="allocations">
                {selectedEmployee.allocations.length === 0 && <p>אין הקצאות לעובד זה.</p>}
                {selectedEmployee.allocations.map((allocation) => (
                  <div key={`${allocation.systemId}-${allocation.roleInSystem}`} className="allocation-row">
                    <div>
                      <strong>{allocation.systemName}</strong>
                      <small>
                        {allocation.roleInSystem} · מתוכנן: {allocation.plannedMonths} · בפועל: {allocation.actualMonths}
                      </small>
                    </div>
                    <span>{allocation.systemCapacityStatus}</span>
                  </div>
                ))}
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={openEditEmployeeModal}
                >
                  עריכת עובד
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={openAllocationModal}
                >
                  + הוספת הקצאה
                </button>
                {allocationOptions.length > 0 && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={openAllocationUpdateModal}
                  >
                    ✎ עדכון חודשים
                  </button>
                )}
              </div>
            </>
          )}
        </article>
      </section>

      {isAllocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAllocationModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsAllocationModalOpen(false)}
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="modal-header">
              <h3>הוספת הקצאה חדשה</h3>
              <p>הקצה עובד למערכת עם תפקיד וחודשים מתוכננים.</p>
            </div>

            <form className="modal-form" onSubmit={handleAddAllocation}>
              <div className="form-grid">
                <label>
                  מערכת
                  <select
                    value={newAllocationState.systemId}
                    onChange={(e) => setNewAllocationState((prev) => ({ ...prev, systemId: e.target.value }))}
                    required
                  >
                    <option value="">בחר מערכת</option>
                    {systems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  תפקיד במערכת
                  <input
                    value={newAllocationState.roleInSystem}
                    onChange={(e) => setNewAllocationState((prev) => ({ ...prev, roleInSystem: e.target.value }))}
                    placeholder="למשל: Backend"
                    required
                  />
                </label>

                <label>
                  חודשים מתוכננים
                  <input
                    type="number"
                    min={0}
                    max={MAX_MONTHS}
                    value={newAllocationState.plannedMonths}
                    onChange={(e) =>
                      setNewAllocationState((prev) => ({
                        ...prev,
                        plannedMonths: clampMonthsInput(e.target.value)
                      }))
                    }
                    placeholder="למשל: 6"
                    required
                  />
                </label>

                <label>
                  חודשים בפועל
                  <input
                    type="number"
                    min={0}
                    max={MAX_MONTHS}
                    value={newAllocationState.actualMonths}
                    onChange={(e) =>
                      setNewAllocationState((prev) => ({
                        ...prev,
                        actualMonths: clampMonthsInput(e.target.value)
                      }))
                    }
                    placeholder="למשל: 0"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setIsAllocationModalOpen(false)}>
                  ביטול
                </button>
                <button type="submit" className="primary-btn" disabled={isSavingAllocation}>
                  {isSavingAllocation ? "שומר..." : "הוספת הקצאה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEmployeeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEmployeeModalOpen(false)}>
          <div className="modal-card employee-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsEmployeeModalOpen(false)}
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="modal-header">
              <h3>{employeeModalMode === "edit" ? "עריכת עובד" : "הוספת עובד"}</h3>
            </div>

            <form className="modal-form" onSubmit={handleCreateEmployee}>
              <section className="modal-section">
                <h4 className="modal-section-title">פרופיל עובד</h4>
                <p className="modal-section-subtitle">נתוני דמו בלבד להצגה</p>

                <div className="form-grid">
                <label>
                  שם מלא
                  <input
                    value={employeeFormState.fullName}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="למשל: נועה ארז"
                    required
                  />
                </label>

                <label>
                  קטגוריה מקצועית
                  <input
                    value={employeeFormState.professionalCategory}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, professionalCategory: e.target.value }))}
                    placeholder="למשל: פיתוח"
                    required
                  />
                </label>

                <label>
                  מנהל
                  <input
                    value={employeeFormState.managerName}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, managerName: e.target.value }))}
                    placeholder="למשל: עידו טל"
                    required
                  />
                </label>

                <label>
                  תת תחום
                  <input
                    value={employeeFormState.professionalSubCategory}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, professionalSubCategory: e.target.value }))}
                    placeholder="למשל: Backend"
                  />
                </label>
              </div>
              </section>

              <section className="modal-section">
                <h4 className="modal-section-title">קיבולת וזמינות</h4>
                <p className="modal-section-subtitle">נתוני דמו בלבד להצגה</p>

                <div className="form-grid">
                  <label>
                    קיבולת שנתית
                    <input
                      type="number"
                      min={0}
                      max={MAX_MONTHS}
                      value={employeeFormState.yearlyCapacityMonths}
                      onChange={(e) =>
                        setEmployeeFormState((prev) => ({
                          ...prev,
                          yearlyCapacityMonths: clampMonthsInput(e.target.value)
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    שנה
                    <input
                      type="number"
                      min={2020}
                      value={employeeFormState.year}
                      onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, year: e.target.value }))}
                      required
                    />
                  </label>

                  <label>
                    אירועים עתידיים
                    <input
                      value={employeeFormState.upcomingEvent}
                      onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, upcomingEvent: e.target.value }))}
                      placeholder="למשל: מילואים ברבעון ג׳"
                    />
                  </label>
                </div>
              </section>

              {employeeModalMode === "edit" && selectedEmployee && (
                <section className="modal-section">
                  <h4 className="modal-section-title">הקצאות למערכות</h4>
                  <p className="modal-section-subtitle">חודש עבודה מתוכנן לכל מערכת</p>
                  {isPlannedOverCapacity && (
                    <p className="modal-warning-text">
                      חריגה אדומה בשחור: סך ההקצאות המתוכננות גבוה מהקיבולת השנתית.
                    </p>
                  )}

                  <div className="allocation-preview-grid">
                    {selectedEmployee.allocations.map((allocation) => (
                      <label key={`${allocation.systemId}-${allocation.roleInSystem}`}>
                        {allocation.systemName}
                        <input type="number" min={0} max={MAX_MONTHS} value={allocation.plannedMonths} readOnly />
                      </label>
                    ))}
                    {selectedEmployee.allocations.length === 0 && <p className="modal-section-subtitle">אין הקצאות פעילות לעובד.</p>}
                  </div>
                </section>
              )}

              <section className="modal-section">
                <div className="form-grid">
                  <label>
                    הערות
                    <textarea
                      value={employeeFormState.notes}
                      onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="הערות כלליות"
                    />
                  </label>

                <label>
                    הערת מנהל
                    <textarea
                      value={employeeFormState.managerReviewNote}
                      onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, managerReviewNote: e.target.value }))}
                      placeholder="משוב מנהל"
                    />
                  </label>
                </div>
              </section>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setIsEmployeeModalOpen(false)}>
                  ביטול
                </button>
                <button type="submit" className="primary-btn" disabled={isSavingEmployee || loadingCreate}>
                  {isSavingEmployee || loadingCreate ? "שומר..." : employeeModalMode === "edit" ? "שמירה" : "יצירת עובד"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAllocationUpdateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAllocationUpdateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsAllocationUpdateModalOpen(false)}
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="modal-header">
              <h3>עדכון חודשי הקצאה בפועל</h3>
              <p>בחר הקצאה קיימת ועדכן את מספר החודשים בפועל.</p>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  מערכת ותפקיד
                  <select
                    value={formState.selectedAllocationKey}
                    onChange={(e) => setFormState((prev) => ({ ...prev, selectedAllocationKey: e.target.value }))}
                    disabled={allocationOptions.length === 0}
                    required
                  >
                    <option value="">בחר הקצאה קיימת</option>
                    {allocationOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  חודשים בפועל
                  <input
                    type="number"
                    min={0}
                    max={MAX_MONTHS}
                    value={formState.actualMonths}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        actualMonths: clampMonthsInput(e.target.value)
                      }))
                    }
                    placeholder="למשל: 5"
                    required
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setIsAllocationUpdateModalOpen(false)}>
                  ביטול
                </button>
                <button type="submit" className="primary-btn" disabled={isSavingAllocationUpdate}>
                  {isSavingAllocationUpdate ? "שומר..." : "שמירת עדכון"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
