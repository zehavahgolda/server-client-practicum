import type { System } from "../../../types";
import {
  formatCurrency,
  formatMetricValue
} from "../../../utils/numberFormatters";

import "./DashboardSystemRow.css";

interface DashboardSystemRowProps {
  system: System;
  showBudget?: boolean;
  onAssign: (system: System) => void;
  onEdit: (system: System) => void;
  onOpenProfile: (system: System) => void;
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
  const budgetGap = (system.allocatedBudget || 0) - (system.usedBudget || 0);
  const budgetStateClass = budgetGap < 0 ? "danger" : "success";

  return (
    <article
      className={`dashboard-system-row ${
        hasShortage
          ? "dashboard-system-row--shortage"
          : "dashboard-system-row--balanced"
      } ${showBudget ? "dashboard-system-row--budget" : ""}`}
      dir="rtl"
    >
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

        {showBudget && (
          <div
            className={`dashboard-system-budget-summary ${budgetStateClass}`}
          >
            <div>
              <span>תקציב</span>
              <strong>{formatCurrency(system.allocatedBudget)}</strong>
            </div>

            <div>
              <span>{budgetGap < 0 ? "חריגה" : "יתרה"}</span>
              <strong>{formatCurrency(Math.abs(budgetGap))}</strong>
            </div>
          </div>
        )}

        <div className="dashboard-system-row-metrics">
          <div>
            <span>נדרש</span>
            <strong>
              {formatMetricValue(system.requiredCapacityMonths)}
            </strong>
          </div>

          <div>
            <span>מוקצה</span>
            <strong>{formatMetricValue(system.allocatedMonths)}</strong>
          </div>

          <div>
            <span>פער</span>
            <strong className={hasShortage ? "danger" : "ok"}>
              {formatMetricValue(Math.abs(system.gap))}
            </strong>
          </div>

          <div>
            <span>עובדים</span>
            <strong>{system.assignedEmployeesCount}</strong>
          </div>

          <div>
            <span>ניצול תקציב</span>
            <strong className={system.budgetGap < 0 ? "danger" : "ok"}>
              {budgetUsagePercent}%
            </strong>
          </div>
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