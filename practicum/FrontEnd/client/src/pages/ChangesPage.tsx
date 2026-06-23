import { useMemo } from "react";
import { useChanges } from "../hooks/useChanges";

const changeTypeLabels = {
  allocation: "🔄 הקצאה",
  employee: "👤 עובד",
  system: "🏗️ מערכת",
  category: "📂 קטגוריה",
  other: "📝 אחר"
};

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
    year: 2026
  });

  const types = useMemo(() => [...new Set(changes.map((c) => c.type))], [changes]);

  return (
    <main className="app-shell" dir="rtl">
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
                  <span className={`impact impact-${change.impact?.toLowerCase()}`}>{change.impact}</span>
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
          grid-template-columns: 1fr 1fr;
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
          margin-bottom: 12px;
          font-size: 18px;
        }

        .changes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 70vh;
          overflow: auto;
        }

        .change-item {
          border: 1px solid #dce3ea;
          border-radius: 10px;
          padding: 10px;
          background: #f9fafb;
        }

        .change-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .change-header strong {
          color: #2864a6;
        }

        .change-date {
          font-size: 12px;
          color: #4b5563;
        }

        .change-item h4 {
          margin: 4px 0;
          font-size: 14px;
        }

        .change-item p {
          margin: 6px 0;
          font-size: 13px;
          color: #374151;
        }

        .change-footer {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .impact {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .impact-high {
          background: #fee2e2;
          color: #991b1b;
        }

        .impact-medium {
          background: #fef3c7;
          color: #b45309;
        }

        .impact-low {
          background: #dcfce7;
          color: #15803d;
        }

        .entity {
          background: #e9f0fa;
          color: #1f4f82;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-month {
          border: 1px solid #dce3ea;
          border-radius: 10px;
          padding: 10px;
        }

        .timeline-month h4 {
          margin: 0 0 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge {
          background: #e9f0fa;
          color: #1f4f82;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .timeline-month ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .timeline-month li {
          border-right: 2px solid #2864a6;
          padding-right: 10px;
          font-size: 12px;
        }

        .timeline-month li strong {
          display: block;
          margin-bottom: 2px;
        }

        .timeline-month li small {
          color: #4b5563;
        }

        .timeline-month li.more {
          color: #4b5563;
          font-style: italic;
        }

        .btn-primary {
          background: #2864a6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .btn-primary:hover {
          background: #1f4f82;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
