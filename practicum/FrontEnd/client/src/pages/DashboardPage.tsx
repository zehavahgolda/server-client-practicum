import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "../hooks/useEmployees";
import { useSystems } from "../hooks/useSystems";
import { KPICard } from "../components/KPICard";
import { calculateKPIs } from "../utils/calculations";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { employees, loadingList: employeesLoading } = useEmployees({ year: 2026 });
  const { systems, loadingList: systemsLoading, meta } = useSystems({ year: 2026 });

  const kpis = useMemo(() => {
    return calculateKPIs(employees, systems);
  }, [employees, systems]);

  const isLoading = employeesLoading || systemsLoading;

  return (
    <main className="dashboard-shell" dir="rtl">
      <header className="dashboard-header">
        <h1>דשבורד ניהולי</h1>
        <p>תמונת מצב של קיבולת, קיבוץ מערכות וזמינות עובדים - מחובר לשרת חי</p>
      </header>

      {isLoading && <div className="loading-bar">טוען נתונים...</div>}

      <section className="kpi-grid">
        <KPICard
          label="מערכות בסיכון"
          value={kpis.systemsAtRisk}
          status={kpis.systemsAtRisk > 0 ? "danger" : "ok"}
          icon="⚠️"
          onClick={() => navigate("/systems?risk=at-risk")}
        />
        <KPICard
          label="פער קיבולת כולל"
          value={kpis.totalGap}
          status={kpis.totalGap > 0 ? "danger" : "ok"}
          icon="📊"
          onClick={() => navigate("/systems?risk=shortage")}
        />
        <KPICard
          label="ניצול קיבולת"
          value={`${kpis.utilizationRate}%`}
          status={
            kpis.utilizationRate > 90 ? "danger" : kpis.utilizationRate > 75 ? "warn" : "ok"
          }
          icon="📈"
          onClick={() => navigate("/employees?availability=low")}
        />
        <KPICard
          label="ציון בריאות"
          value={`${kpis.healthScore}%`}
          status={
            kpis.healthScore >= 75 ? "ok" : kpis.healthScore >= 50 ? "warn" : "danger"
          }
          icon="💚"
          onClick={() => navigate("/employees?availability=overloaded")}
        />
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <h2>סיכום מערכות</h2>
          <ul className="summary-list">
            <li>
              <strong>סה"כ מערכות:</strong>
              <span>{meta.total}</span>
            </li>
            <li>
              <strong>מאוזנות:</strong>
              <span className="ok">{meta.balanced}</span>
            </li>
            <li>
              <strong>בחסור:</strong>
              <span className="warn">{meta.inShortage}</span>
            </li>
            <li>
              <strong>בסיכון:</strong>
              <span className="danger">{meta.atRisk}</span>
            </li>
            <li>
              <strong>עודף קיבולת:</strong>
              <span className="brand">{meta.totalSurplus}</span>
            </li>
          </ul>
        </article>

        <article className="dashboard-panel">
          <h2>סיכום עובדים</h2>
          <ul className="summary-list">
            <li>
              <strong>סה"כ עובדים:</strong>
              <span>{employees.length}</span>
            </li>
            <li>
              <strong>סה"כ קיבולת:</strong>
              <span>{employees.reduce((sum, e) => sum + e.yearlyCapacityMonths, 0)}</span>
            </li>
            <li>
              <strong>סה"כ מנוצל:</strong>
              <span>{employees.reduce((sum, e) => sum + e.allocatedMonths, 0)}</span>
            </li>
            <li>
              <strong>בלחץ קיבולת:</strong>
              <span className="warn">{kpis.lowCapacityEmployees}</span>
            </li>
          </ul>
        </article>
      </section>

      <style>{`
        .dashboard-shell {
          max-width: 1300px;
          margin: 0 auto;
          padding: 20px;
          color: var(--text-primary);
        }

        .dashboard-header {
          background: var(--surface-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-soft);
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 24px;
        }

        .dashboard-header p {
          margin: 6px 0 0;
          color: var(--text-secondary);
        }

        .loading-bar {
          background: #e9f0fa;
          color: #1f4f82;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .kpi-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .kpi-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 700;
        }

        .kpi-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .dashboard-panel {
          background: var(--surface-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 14px;
          box-shadow: var(--shadow-soft);
        }

        .dashboard-panel h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 18px;
        }

        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-list li {
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          background: var(--surface-alt);
          border-radius: 8px;
          font-size: 14px;
        }

        .summary-list strong {
          color: var(--text-primary);
        }

        .summary-list span {
          font-weight: 700;
        }

        .summary-list .ok {
          color: var(--status-success);
        }

        .summary-list .warn {
          color: var(--status-danger);
        }

        .summary-list .danger {
          color: var(--status-danger);
        }

        .summary-list .brand {
          color: var(--status-surplus);
        }

        @media (max-width: 980px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
