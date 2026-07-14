import type { System } from "../../../types";
import "./DashboardSystemRow.css";

interface DashboardSystemRowProps {
  system: System;
  showBudget?: boolean;
  onAssign: (system: System) => void;
  onEdit: (system: System) => void;
  onOpenProfile: (system: System) => void;
}

function formatMetric(value: number) {
  return new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getBudgetUsagePercent(system: System) {
  if (!system.allocatedBudget || system.allocatedBudget <= 0) {
    return 0;
  }

  return Math.round(
    ((system.usedBudget || 0) / system.allocatedBudget) * 100
  );
}

// שורה קומפקטית להצגת מערכת בתוך פופאפ KPI.
// הקומפוננטה אינה מנהלת state ואינה מבצעת קריאות API;
// היא רק מציגה נתונים ומעבירה פעולות לקומפוננטה ההורה.
export default function DashboardSystemRow({
  system,
  showBudget = false,
  onAssign,
  onEdit,
  onOpenProfile
}: DashboardSystemRowProps) {
  const hasShortage = system.gap > 0;
  const budgetUsagePercent = getBudgetUsagePercent(system);

  return (
    <article className="dashboard-system-row" dir="rtl">
      <div className="dashboard-system-row-main">
        <div className="dashboard-system-row-title">
          <h4>{system.name}</h4>

          <span
            className={`dashboard-system-status ${
              hasShortage ? "shortage" : "balanced"
            }`}
          >
            {hasShortage ? "מחסור" : "מאוזן / עודף"}
          </span>
        </div>

        <div className="dashboard-system-row-metrics">
          <div>
            <span>נדרש</span>
            <strong>{formatMetric(system.requiredCapacityMonths)}</strong>
          </div>

          <div>
            <span>מוקצה</span>
            <strong>{formatMetric(system.allocatedMonths)}</strong>
          </div>

          <div>
            <span>פער</span>
            <strong className={hasShortage ? "danger" : "ok"}>
              {formatMetric(Math.abs(system.gap))}
            </strong>
          </div>

          <div>
            <span>עובדים</span>
            <strong>{system.assignedEmployeesCount}</strong>
          </div>

          {showBudget && (
            <>
              <div>
                <span>תקציב מוקצה</span>
                <strong>{formatCurrency(system.allocatedBudget)}</strong>
              </div>

              <div>
                <span>ניצול תקציב</span>
                <strong className={system.budgetGap < 0 ? "danger" : ""}>
                  {budgetUsagePercent}%
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-system-row-actions">
        {hasShortage && (
          <button
            type="button"
            className="primary-btn dashboard-system-action"
            onClick={() => onAssign(system)}
          >
            שיבוץ עובדים
          </button>
        )}

        <button
          type="button"
          className="secondary-btn dashboard-system-action"
          onClick={() => onEdit(system)}
        >
          עריכת מערכת
        </button>

        <button
          type="button"
          className="small-outline-btn dashboard-system-action"
          onClick={() => onOpenProfile(system)}
        >
          פתיחת פרופיל
        </button>
      </div>
    </article>
  );
}