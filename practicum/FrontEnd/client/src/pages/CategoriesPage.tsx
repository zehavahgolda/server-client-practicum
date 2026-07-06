import PageTabs from "../components/PageTabs";
import { useCategories } from "../hooks/useCategories";

// מחזיר את השנה הפעילה כברירת מחדל לפילטרים.
function getActiveYear() {
  return new Date().getFullYear();
}

// עמוד קטגוריות: רשימה, פרטים ומדדי ניצול לפי תחום מקצועי.
export default function CategoriesPage() {
  const {
    categories,
    selectedCategory,
    loadingList,
    loadingDetails,
    error,
    endpointAvailable,
    retryInSeconds,
    filters,
    setFilters,
    loadCategoryDetails,
    meta
  } = useCategories({
    year: getActiveYear()
  });

  return (
    <main className="app-shell" dir="rtl">
      <PageTabs />
      <header className="app-header">
        <h1>קטגוריות מקצועיות</h1>
        <p>ניתוח קיבולת וניצול לפי קטגוריה מקצועית</p>
      </header>

      <section className="toolbar">
        <label>
          חיפוש
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="שם קטגוריה"
          />
        </label>

        <div className="toolbar-stats">
          <span>קטגוריות: {meta.total}</span>
          <span>עובדים: {meta.totalEmployees}</span>
          <span>ניצול ממוצע: {meta.avgUtilization}%</span>
        </div>
      </section>

      {error && (
        <div className={endpointAvailable ? "error-box" : "info-box"}>
          {error}
          {!endpointAvailable ? ` נסיון חוזר בעוד ${retryInSeconds} שניות.` : ""}
        </div>
      )}

      <section className="layout">
        <article className="panel list-panel">
          <h2>רשימת קטגוריות</h2>
          {loadingList ? <p>טוען קטגוריות...</p> : null}

          <div className="categories-list">
            {categories.length === 0 && <p>אין קטגוריות להצגה.</p>}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`category-row ${selectedCategory?.id === category.id ? "selected" : ""}`}
                onClick={() => loadCategoryDetails(category.id)}
              >
                <div className="category-main">
                  <strong>{category.name}</strong>
                  <small>{category.employeesCount} עובדים</small>
                </div>
                <div className="category-metrics">
                  <span>קיבולת: {category.totalCapacityMonths}</span>
                  <span>מנוצל: {category.allocatedMonths}</span>
                  <span
                    className={
                      category.utilizationRate > 90
                        ? "danger"
                        : category.utilizationRate > 75
                          ? "warn"
                          : "ok"
                    }
                  >
                    {category.utilizationRate}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="panel details-panel">
          <h2>פרטי קטגוריה</h2>
          {!selectedCategory && <p>בחר קטגוריה להצגת פרטים.</p>}
          {loadingDetails ? <p>טוען פרטים...</p> : null}

          {selectedCategory && !loadingDetails && (
            <>
              <div className="detail-head">
                <h3>{selectedCategory.name}</h3>
                {selectedCategory.description && <p>{selectedCategory.description}</p>}
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">עובדים</div>
                  <div className="metric-value">{selectedCategory.employeesCount}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">סה"כ קיבולת</div>
                  <div className="metric-value">{selectedCategory.totalCapacityMonths}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">מנוצל</div>
                  <div className="metric-value">{selectedCategory.allocatedMonths}</div>
                </div>
                <div className="metric-card">
                  <div className={`metric-value ${selectedCategory.utilizationRate > 90 ? "danger" : selectedCategory.utilizationRate > 75 ? "warn" : "ok"}`}>
                    {selectedCategory.utilizationRate}%
                  </div>
                  <div className="metric-label">ניצול</div>
                </div>
              </div>

              <h4>עובדים בקטגוריה</h4>
              <div className="employees-list">
                {selectedCategory.employees.length === 0 && <p>אין עובדים בקטגוריה.</p>}
                {selectedCategory.employees.map((emp) => (
                  <div key={emp.id} className="employee-item">
                    <div>
                      <strong>{emp.fullName}</strong>
                      <small>
                        מנהל: {emp.manager} · {emp.status}
                      </small>
                    </div>
                    <div className="emp-allocation">
                      <span>מוקצה: {emp.allocatedMonths}</span>
                      <span className={emp.remainingMonths <= 1 ? "danger" : "ok"}>
                        נותר: {emp.remainingMonths}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h4>התפלגות במערכות</h4>
              <div className="systems-distribution">
                {selectedCategory.systemsDistribution.length === 0 && <p>אין מערכות.</p>}
                {selectedCategory.systemsDistribution.map((sys) => (
                  <div key={sys.systemId} className="system-dist">
                    <div>
                      <strong>{sys.systemName}</strong>
                      <small>{sys.employeeCount} עובדים</small>
                    </div>
                    <span>{sys.totalMonths} חודשים</span>
                  </div>
                ))}
              </div>
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
          grid-template-columns: minmax(180px, 1fr) auto;
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

        .toolbar input {
          border: 1px solid #c7ced7;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 13px;
          background: #fff;
        }

        .toolbar-stats {
          display: flex;
          gap: 8px;
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
          background: #fbe8ea;
          border: 1px solid #e5a6af;
          color: #8d1f2f;
          border-radius: 10px;
          padding: 10px 12px;
          margin-top: 10px;
        }

        .info-box {
          background: #e9f0fa;
          border: 1px solid #b3cbe9;
          color: #1f4f82;
          border-radius: 10px;
          padding: 10px 12px;
          margin-top: 10px;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 12px;
          margin-top: 12px;
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

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 68vh;
          overflow: auto;
        }

        .category-row {
          width: 100%;
          text-align: right;
          border: 1px solid #dce3ea;
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

        .category-row:hover {
          border-color: #5b8fc7;
        }

        .category-row.selected {
          border-color: #2864a6;
          background: #eef5fd;
        }

        .category-main {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .category-main small {
          color: #4b5563;
        }

        .category-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          min-width: 95px;
        }

        .category-metrics .danger {
          color: #9b1c1c;
          font-weight: 700;
        }

        .category-metrics .warn {
          color: #8a4b0e;
          font-weight: 700;
        }

        .category-metrics .ok {
          color: #0f6e56;
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

        .metric-value.warn {
          color: #b45309;
        }

        .employees-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .employee-item {
          border: 1px solid #dce3ea;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .employee-item small {
          display: block;
          margin-top: 2px;
          color: #4b5563;
          font-size: 12px;
        }

        .emp-allocation {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }

        .emp-allocation .danger {
          color: #9b1c1c;
          font-weight: 700;
        }

        .emp-allocation .ok {
          color: #0f6e56;
        }

        .systems-distribution {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .system-dist {
          border: 1px solid #dce3ea;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .system-dist small {
          display: block;
          margin-top: 2px;
          color: #4b5563;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .toolbar {
            grid-template-columns: 1fr;
          }

          .layout {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
