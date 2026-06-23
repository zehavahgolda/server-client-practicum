import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSystems } from "../hooks/useSystems";
import { getStatusColor } from "../utils/calculations";

export default function SystemsPage() {
  const [searchParams] = useSearchParams();
  const riskFilter = searchParams.get("risk");
  const { systems, selectedSystem, loadingList, loadingDetails, error, filters, setFilters, loadSystemDetails } = useSystems({
    // Note: API returns systems with year=0/null, so we don't filter by year here
  });

  const visibleSystems = useMemo(() => {
    if (riskFilter === "at-risk") {
      return systems.filter((sys) => sys.gap > 4);
    }

    if (riskFilter === "shortage") {
      return systems.filter((sys) => sys.gap > 0);
    }

    if (riskFilter === "balanced") {
      return systems.filter((sys) => sys.gap <= 0);
    }

    return systems;
  }, [systems, riskFilter]);

  const statuses = useMemo(() => [...new Set(visibleSystems.map((s) => s.capacityStatus))], [visibleSystems]);

  return (
    <main className="app-shell" dir="rtl">
      <header className="app-header">
        <h1>ניהול מערכות</h1>
        <p>רשימת מערכות, פרטים ותקציבים חיים</p>
      </header>

      <section className="toolbar">
        <label>
          חיפוש
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="שם מערכת"
          />
        </label>

        <label>
          סטטוס
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value || undefined
              }))
            }
          >
            <option value="">כל הסטטוסים</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar-stats">
          <span>סה"כ: {visibleSystems.length}</span>
          <span>בחסור: {visibleSystems.filter((s) => s.gap > 0).length}</span>
          <span>מאוזנות: {visibleSystems.filter((s) => s.gap <= 0).length}</span>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="layout">
        <article className="panel list-panel">
          <h2>מערכות</h2>
          {loadingList ? <p>טוען מערכות...</p> : null}

          <div className="systems-list">
            {visibleSystems.map((system) => (
              <button
                key={system.id}
                type="button"
                className={`system-row ${selectedSystem?.id === system.id ? "selected" : ""}`}
                onClick={() => loadSystemDetails(system.id)}
                style={{
                  borderRightColor: getStatusColor(system.capacityStatus)
                }}
              >
                <div className="system-main">
                  <strong>{system.name}</strong>
                  <small>{system.assignedEmployeesCount} עובדים משויכים</small>
                </div>
                <div className="system-metrics">
                  <span>נדרש: {system.requiredCapacityMonths}</span>
                  <span>מוקצה: {system.allocatedMonths}</span>
                  <span className={system.gap < 0 ? "brand" : system.gap > 4 ? "danger" : system.gap > 0 ? "warn" : "ok"}>
                    פער: {system.gap}
                  </span>
                </div>
                <span className="status-badge" style={{ background: getStatusColor(system.capacityStatus) }}>
                  {system.capacityStatus}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel details-panel">
          <h2>פרטי מערכת</h2>
          {!selectedSystem && <p>בחר מערכת להצגת פרטים.</p>}
          {loadingDetails ? <p>טוען פרטים...</p> : null}

          {selectedSystem && !loadingDetails && (
            <>
              <div className="detail-head">
                <h3>{selectedSystem.name}</h3>
                <p>סטטוס: {selectedSystem.capacityStatus}</p>
                {selectedSystem.managementNote && <p>הערה: {selectedSystem.managementNote}</p>}
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">נדרש</div>
                  <div className="metric-value">{selectedSystem.requiredCapacityMonths}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">מוקצה</div>
                  <div className="metric-value">{selectedSystem.allocatedMonths}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">פער</div>
                  <div className={`metric-value ${selectedSystem.gap > 0 ? "danger" : "ok"}`}>
                    {selectedSystem.gap}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">עובדים</div>
                  <div className="metric-value">{selectedSystem.assignedEmployeesCount}</div>
                </div>
              </div>

              <h4>עובדים משויכים</h4>
              <div className="employees-list">
                {selectedSystem.assignedEmployees.length === 0 && <p>אין עובדים משויכים.</p>}
                {selectedSystem.assignedEmployees.map((emp) => (
                  <div key={emp.id} className="employee-row">
                    <div>
                      <strong>{emp.fullName}</strong>
                      <small>
                        {emp.professionalCategory} · {emp.professionalSubCategory || "-"}
                      </small>
                    </div>
                    <span>{emp.allocatedMonths} חודשים</span>
                  </div>
                ))}
              </div>

              {selectedSystem.budget && (
                <>
                  <h4>תקציב</h4>
                  <div className="budget-grid">
                    <div>
                      <div className="label">סה"כ תקציב</div>
                      <div className="value">₪{selectedSystem.budget.totalBudget.toLocaleString("he-IL")}</div>
                    </div>
                    <div>
                      <div className="label">חודשים מתוכננים</div>
                      <div className="value">{selectedSystem.budget.totalPlannedMonths}</div>
                    </div>
                    <div>
                      <div className="label">חודשים בפועל</div>
                      <div className="value">{selectedSystem.budget.totalActualMonths}</div>
                    </div>
                    <div>
                      <div className="label">שונות</div>
                      <div className="value">{selectedSystem.budget.variancePercent}%</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </article>
      </section>

      <style>{`
        .app-shell {
          max-width: 1300px;
          margin: 0 auto;
          padding: 20px;
        }

        .app-header {
          background: #ffffff;
          border: 1px solid #d8dde3;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 12px;
        }

        .app-header h1 {
          margin: 0;
          font-size: 24px;
        }

        .app-header p {
          margin: 6px 0 0;
          color: #4b5563;
        }

        .toolbar {
          background: #ffffff;
          border: 1px solid #d8dde3;
          border-radius: 12px;
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(180px, 1fr)) auto;
          gap: 10px;
          align-items: end;
        }

        .toolbar label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #374151;
          font-weight: 700;
        }

        .toolbar input,
        .toolbar select {
          border: 1px solid #c7ced7;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 13px;
          background: #fff;
        }

        .toolbar-stats {
          display: flex;
          gap: 8px;
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .toolbar-stats span {
          background: #e9f0fa;
          color: #1f4f82;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .error-box {
          margin-top: 10px;
          background: #fbe8ea;
          border: 1px solid #e5a6af;
          color: #8d1f2f;
          border-radius: 10px;
          padding: 10px 12px;
        }

        .layout {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 12px;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #d8dde3;
          border-radius: 12px;
          padding: 14px;
        }

        .panel h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 18px;
        }

        .panel h4 {
          margin: 12px 0 8px;
          font-size: 14px;
        }

        .systems-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 68vh;
          overflow: auto;
        }

        .system-row {
          width: 100%;
          text-align: right;
          border: 1px solid #dce3ea;
          border-right: 3px solid;
          background: #fff;
          border-radius: 10px;
          padding: 10px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-family: inherit;
        }

        .system-row:hover {
          border-color: #5b8fc7;
        }

        .system-row.selected {
          border-color: #2864a6;
          background: #eef5fd;
        }

        .system-main {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .system-main small {
          color: #4b5563;
        }

        .system-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          min-width: 95px;
        }

        .system-metrics .danger {
          color: #9b1c1c;
          font-weight: 700;
        }

        .system-metrics .warn {
          color: #8a4b0e;
          font-weight: 700;
        }

        .system-metrics .ok {
          color: #0f6e56;
          font-weight: 700;
        }

        .system-metrics .brand {
          color: #0369a1;
          font-weight: 700;
        }

        .status-badge {
          color: #fff;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .detail-head h3 {
          margin-bottom: 6px;
        }

        .detail-head p {
          margin: 4px 0;
          color: #374151;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 800;
          color: #1f2937;
        }

        .metric-value.danger {
          color: #991b1b;
        }

        .metric-value.ok {
          color: #0f6e56;
        }

        .employees-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .employee-row {
          border: 1px solid #dce3ea;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .employee-row small {
          display: block;
          margin-top: 2px;
          color: #4b5563;
          font-size: 12px;
        }

        .budget-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .budget-grid > div {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }

        .budget-grid .label {
          font-size: 12px;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .budget-grid .value {
          font-size: 16px;
          font-weight: 800;
          color: #1f2937;
        }

        @media (max-width: 980px) {
          .toolbar {
            grid-template-columns: 1fr;
          }

          .layout {
            grid-template-columns: 1fr;
          }

          .metrics-grid,
          .budget-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
