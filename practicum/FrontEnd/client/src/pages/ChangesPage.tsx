import { useMemo } from "react";
import { useChanges } from "../hooks/useChanges";
import "./ChangesPage.css";
import PageTabs from "../components/shared/navigation/PageTabs";

// מחזיר את השנה הפעילה כברירת מחדל לפילטרים.
function getActiveYear() {
  return new Date().getFullYear();
}

// ממיר רמת השפעה למחלקת עיצוב בטוחה מתוך ערכים ידועים.
function getImpactClass(impact?: string) {
  const normalized = impact?.trim().toLowerCase();

  if (normalized === "high") return "impact-high";
  if (normalized === "medium") return "impact-medium";
  if (normalized === "low") return "impact-low";

  return "impact-low";
}

// תרגום סוג שינוי לתווית תצוגה ידידותית.
const changeTypeLabels = {
  allocation: "🔄 הקצאה",
  employee: "👤 עובד",
  system: "🏗️ מערכת",
  category: "📂 קטגוריה",
  other: "📝 אחר"
};

// עמוד שינויים: רשימת שינויים, פילטרים וציר זמן מפורט.
export default function ChangesPage() {
  const {
    changes,
    timeline,
    loading,
    error,
    endpointAvailable,
    retryInSeconds,
    filters,
    setFilters,
    loadTimeline
  } = useChanges({
    year: getActiveYear()
  });

  // סוגי השינויים הזמינים לפילטר נוצרים דינמית מהנתונים.
  const types = useMemo(() => [...new Set(changes.map((c) => c.type))], [changes]);

  return (
    <main className="app-shell" dir="rtl">
      <PageTabs />
      <header className="app-header">
        <h1>היסטוריית שינויים</h1>
        <p>צפייה בכל השינויים שהתרחשו במערכת לאורך הזמן</p>
      </header>

      <section className="toolbar">
        <label>
          חיפוש
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="חפש שינוי"
          />
        </label>

        <label>
          סוג שינוי
          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value || undefined
              }))
            }
          >
            <option value="">כל הסוגים</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {changeTypeLabels[type as keyof typeof changeTypeLabels] || type}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar-stats">
          <span>סה"כ: {changes.length}</span>
          <span>הקצאות: {changes.filter((c) => c.type === "allocation").length}</span>
        </div>
      </section>

      {error && (
        <div className={endpointAvailable ? "error-box" : "info-box"}>
          {error}
          {!endpointAvailable ? ` נסיון חוזר בעוד ${retryInSeconds} שניות.` : ""}
        </div>
      )}

      <section className="layout">
        <article className="panel">
          <h2>שינויים</h2>
          {loading ? <p>טוען שינויים...</p> : null}

          <div className="changes-list">
            {changes.length === 0 && <p>אין שינויים להצגה.</p>}
            {changes.map((change) => (
              <div key={change.id} className="change-item">
                <div className="change-header">
                  <strong>
                    {changeTypeLabels[change.type as keyof typeof changeTypeLabels] || change.type}
                  </strong>
                  <span className="change-date">{new Date(change.date).toLocaleDateString("he-IL")}</span>
                </div>
                <h4>{change.title}</h4>
                <p>{change.description}</p>
                <div className="change-footer">
                  <span className={`impact ${getImpactClass(change.impact)}`}>{change.impact}</span>
                  {change.relatedEntityName && (
                    <span className="entity">
                      {change.relatedEntityName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>ציר זמן</h2>
          <button
            type="button"
            onClick={() => loadTimeline()}
            className="btn-primary"
            disabled={!endpointAvailable}
          >
            טען ציר זמן מפורט
          </button>

          {timeline.length > 0 && (
            <div className="timeline-list">
              {timeline.map((month) => (
                <div key={month.month} className="timeline-month">
                  <h4>{month.month}</h4>
                  <span className="badge">{month.changesCount} שינויים</span>
                  <ul>
                    {month.changes.slice(0, 3).map((change) => (
                      <li key={change.id}>
                        <strong>{change.title}</strong>
                        <small>{change.description}</small>
                      </li>
                    ))}
                    {month.changes.length > 3 && (
                      <li className="more">
                        ועוד {month.changes.length - 3} שינויים נוספים
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
