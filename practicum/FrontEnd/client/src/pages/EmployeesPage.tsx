import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmployees } from "../hooks/useEmployees";


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
    setSelectedEmployee,
    createEmployee,
    updateEmployee,
    updateActualMonths
  } = useEmployees({ year: 2026 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState({
    fullName: "",
    professionalCategory: "",
    professionalSubCategory: "",
    managerName: "",
    year: "2026",
    yearlyCapacityMonths: "12",
    upcomingEvent: "",
    notes: "",
    managerReviewNote: ""
  });

  const [employeeFormState, setEmployeeFormState] = useState(createFormState);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);

  useEffect(() => {
    if (!selectedEmployee) {
      setEmployeeFormState(createFormState);
      setIsEditingEmployee(false);
      return;
    }

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
    setIsEditingEmployee(true);
  }, [selectedEmployee]);

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
    if (Number.isNaN(actualMonths)) {
      return;
    }

    await updateActualMonths(selectedAllocation.systemId, selectedAllocation.roleInSystem, actualMonths);
    setFormState({ selectedAllocationKey: "", actualMonths: "" });
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

    if (Number.isNaN(year) || Number.isNaN(yearlyCapacityMonths)) {
      return;
    }

    await createEmployee({
      fullName,
      professionalCategory,
      professionalSubCategory: employeeFormState.professionalSubCategory.trim() || undefined,
      managerName,
      year,
      yearlyCapacityMonths,
      upcomingEvent: employeeFormState.upcomingEvent.trim() || undefined,
      notes: employeeFormState.notes.trim() || undefined,
      managerReviewNote: employeeFormState.managerReviewNote.trim() || undefined
    });

    setCreateFormState({
      fullName: "",
      professionalCategory: "",
      professionalSubCategory: "",
      managerName: "",
      year: "2026",
      yearlyCapacityMonths: "12",
      upcomingEvent: "",
      notes: "",
      managerReviewNote: ""
    });
    setEmployeeFormState({
      fullName: "",
      professionalCategory: "",
      professionalSubCategory: "",
      managerName: "",
      year: "2026",
      yearlyCapacityMonths: "12",
      upcomingEvent: "",
      notes: "",
      managerReviewNote: ""
    });
    setIsCreateOpen(false);
  };

  const handleUpdateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEmployee?.id) {
      return;
    }

    const fullName = employeeFormState.fullName.trim();
    const professionalCategory = employeeFormState.professionalCategory.trim();
    const managerName = employeeFormState.managerName.trim();
    const year = Number(employeeFormState.year);
    const yearlyCapacityMonths = Number(employeeFormState.yearlyCapacityMonths);

    if (!fullName || !professionalCategory || !managerName) {
      return;
    }

    if (Number.isNaN(year) || Number.isNaN(yearlyCapacityMonths)) {
      return;
    }

    await updateEmployee(selectedEmployee.id, {
      fullName,
      professionalCategory,
      professionalSubCategory: employeeFormState.professionalSubCategory.trim() || undefined,
      managerName,
      year,
      yearlyCapacityMonths,
      upcomingEvent: employeeFormState.upcomingEvent.trim() || undefined,
      notes: employeeFormState.notes.trim() || undefined,
      managerReviewNote: employeeFormState.managerReviewNote.trim() || undefined
    });
  };

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
            setSelectedEmployee(null);
            setIsCreateOpen(true);
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
                  setIsCreateOpen(false);
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
          {!selectedEmployee && !isCreateOpen && <p>בחר עובד להצגת פרטים או לחץ על "הוספת עובד".</p>}
          {loadingDetails ? <p>טוען פרטים...</p> : null}

          {(isCreateOpen || selectedEmployee) && (
            <form className="allocation-form" onSubmit={isEditingEmployee ? handleUpdateEmployee : handleCreateEmployee}>
              <h4>{isEditingEmployee ? "עריכת עובד" : "הוספת עובד חדש"}</h4>
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
                  תת-תחום
                  <input
                    value={employeeFormState.professionalSubCategory}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, professionalSubCategory: e.target.value }))}
                    placeholder="למשל: Backend"
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
                  קיבולת שנתית (חודשים)
                  <input
                    type="number"
                    min={0}
                    value={employeeFormState.yearlyCapacityMonths}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, yearlyCapacityMonths: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  אירוע עתידי
                  <input
                    value={employeeFormState.upcomingEvent}
                    onChange={(e) => setEmployeeFormState((prev) => ({ ...prev, upcomingEvent: e.target.value }))}
                    placeholder="למשל: מילואים ברבעון ג׳"
                  />
                </label>

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

              <button type="submit" className="primary-btn" disabled={loadingCreate}>
                {loadingCreate ? "שומר..." : isEditingEmployee ? "שמירת שינויים" : "שמירת עובד"}
              </button>
            </form>
          )}

          {selectedEmployee && !loadingDetails && !isCreateOpen && (
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

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsEditingEmployee(true)}
              >
                עריכת עובד
              </button>

              <form className="allocation-form" onSubmit={handleSubmit}>
                <h4>עדכון חודשי הקצאה בפועל</h4>
                <div className="form-grid">
                  <label>
                    מערכת ותפקיד
                    <select
                      value={formState.selectedAllocationKey}
                      onChange={(e) => setFormState((prev) => ({ ...prev, selectedAllocationKey: e.target.value }))}
                      disabled={allocationOptions.length === 0}
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
                    ActualMonths
                    <input
                      type="number"
                      min={0}
                      value={formState.actualMonths}
                      onChange={(e) => setFormState((prev) => ({ ...prev, actualMonths: e.target.value }))}
                      placeholder="למשל: 5"
                    />
                  </label>
                </div>

                <button type="submit" className="primary-btn">
                  שמירת עדכון
                </button>
              </form>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
