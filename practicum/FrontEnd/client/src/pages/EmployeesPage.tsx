import { useMemo, useState } from "react";
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
    error,
    filters,
    setFilters,
    loadEmployeeDetails,
    updateActualMonths
  } = useEmployees({ year: 2026 });

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

  const [formState, setFormState] = useState({
    systemId: "",
    roleInSystem: "",
    actualMonths: ""
  });

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

    if (!formState.systemId.trim() || !formState.roleInSystem.trim()) {
      return;
    }

    const actualMonths = Number(formState.actualMonths);
    if (Number.isNaN(actualMonths)) {
      return;
    }

    await updateActualMonths(formState.systemId.trim(), formState.roleInSystem.trim(), actualMonths);
    setFormState({ systemId: "", roleInSystem: "", actualMonths: "" });
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
          <span>סה"כ: {viewMeta.total}</span>
          <span>בלחץ: {viewMeta.lowCapacity}</span>
          <span>עומס יתר: {viewMeta.overloaded}</span>
        </div>
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
                className={`employee-row ${selectedEmployee?.id === employee.id ? "selected" : ""}`}
                onClick={() => loadEmployeeDetails(employee.id)}
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
              </button>
            ))}
          </div>
        </article>

        <article className="panel details-panel">
          <h2>פרטי עובד</h2>
          {!selectedEmployee && <p>בחר עובד להצגת פרטים.</p>}
          {loadingDetails ? <p>טוען פרטים...</p> : null}

          {selectedEmployee && !loadingDetails && (
            <>
              <div className="detail-head">
                <h3>{selectedEmployee.fullName}</h3>
                <p>
                  {selectedEmployee.professionalCategory} · {selectedEmployee.professionalSubCategory || "-"}
                </p>
                <p>סטטוס זמינות: {selectedEmployee.availabilityStatus}</p>
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

              <form className="allocation-form" onSubmit={handleSubmit}>
                <h4>עדכון חודשי הקצאה בפועל</h4>
                <div className="form-grid">
                  <label>
                    SystemId
                    <input
                      value={formState.systemId}
                      onChange={(e) => setFormState((prev) => ({ ...prev, systemId: e.target.value }))}
                      placeholder="למשל: servicenow"
                    />
                  </label>

                  <label>
                    RoleInSystem
                    <input
                      value={formState.roleInSystem}
                      onChange={(e) => setFormState((prev) => ({ ...prev, roleInSystem: e.target.value }))}
                      placeholder="למשל: Backend"
                    />
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
