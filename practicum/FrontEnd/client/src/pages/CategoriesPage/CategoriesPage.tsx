import PageTabs from "../../components/shared/navigation/PageTabs";
import { useCategories } from "../../hooks/useCategories";
import { getActiveYear } from "../../utils/yearOptions";

import "./CategoriesPage.css";

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
            onChange={(event) =>
              setFilters((previousFilters) => ({
                ...previousFilters,
                search: event.target.value
              }))
            }
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
          {!endpointAvailable
            ? ` נסיון חוזר בעוד ${retryInSeconds} שניות.`
            : ""}
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
                className={`category-row ${
                  selectedCategory?.id === category.id ? "selected" : ""
                }`}
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

                {selectedCategory.description && (
                  <p>{selectedCategory.description}</p>
                )}
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">עובדים</div>
                  <div className="metric-value">
                    {selectedCategory.employeesCount}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">סה"כ קיבולת</div>
                  <div className="metric-value">
                    {selectedCategory.totalCapacityMonths}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">מנוצל</div>
                  <div className="metric-value">
                    {selectedCategory.allocatedMonths}
                  </div>
                </div>

                <div className="metric-card">
                  <div
                    className={`metric-value ${
                      selectedCategory.utilizationRate > 90
                        ? "danger"
                        : selectedCategory.utilizationRate > 75
                          ? "warn"
                          : "ok"
                    }`}
                  >
                    {selectedCategory.utilizationRate}%
                  </div>

                  <div className="metric-label">ניצול</div>
                </div>
              </div>

              <h4>עובדים בקטגוריה</h4>

              <div className="employees-list">
                {selectedCategory.employees.length === 0 && (
                  <p>אין עובדים בקטגוריה.</p>
                )}

                {selectedCategory.employees.map((employee) => (
                  <div key={employee.id} className="employee-item">
                    <div>
                      <strong>{employee.fullName}</strong>
                      <small>
                        מנהל: {employee.manager} · {employee.status}
                      </small>
                    </div>

                    <div className="emp-allocation">
                      <span>מוקצה: {employee.allocatedMonths}</span>

                      <span
                        className={
                          employee.remainingMonths <= 1 ? "danger" : "ok"
                        }
                      >
                        נותר: {employee.remainingMonths}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h4>התפלגות במערכות</h4>

              <div className="systems-distribution">
                {selectedCategory.systemsDistribution.length === 0 && (
                  <p>אין מערכות.</p>
                )}

                {selectedCategory.systemsDistribution.map((system) => (
                  <div key={system.systemId} className="system-dist">
                    <div>
                      <strong>{system.systemName}</strong>
                      <small>{system.employeeCount} עובדים</small>
                    </div>

                    <span>{system.totalMonths} חודשים</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>
    </main>
  );
}