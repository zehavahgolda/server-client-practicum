import type { System } from "../../../types";
import { formatCurrency } from "../../../utils/numberFormatters";

import "./SystemCard.css";

interface SystemCardProps {
  system: System;
  selected?: boolean;
  onClick: () => void;
}

type SystemCardTone =
  | "shortage"
  | "excess"
  | "balanced";

type CapacityTone =
  | "shortage"
  | "excess"
  | "balanced";

type BudgetTone =
  | "shortage"
  | "balanced"
  | "neutral";

// מצב פער חודשי העבודה של המערכת.
//
// לפי מבנה הנתונים הקיים:
// gap > 0  = חסרים חודשי עבודה
// gap < 0  = הוקצו יותר חודשי עבודה מהנדרש
// gap === 0 = הקצאה מאוזנת
function getCapacityTone(
  system: System
): CapacityTone {
  if (system.gap > 0) {
    return "shortage";
  }

  if (system.gap < 0) {
    return "excess";
  }

  return "balanced";
}

// מצב הפס העליון של הכרטיס.
//
// הפס מייצג אך ורק את מצב הקיבולת,
// כדי לשמור על התאמה בין:
// - קבוצת המערכת
// - הפס העליון בכרטיס
// - מדד הפער
//
// מצב התקציב מוצג בנפרד באזור התקציב.
export function getSystemCardTone(
  system: System
): SystemCardTone {
  return getCapacityTone(system);
}

// מצב אזור התקציב.
// מבחינה עיצובית כל המצבים נשארים בגוונים ניטרליים,
// אך הטקסט ממשיך להציג אם קיימת יתרה או חריגה.
function getBudgetTone(
  system: System
): BudgetTone {
  if (
    !system.allocatedBudget ||
    system.allocatedBudget <= 0
  ) {
    return "neutral";
  }

  if (system.budgetGap < 0) {
    return "shortage";
  }

  return "balanced";
}

export default function SystemCard({
  system,
  selected = false,
  onClick
}: SystemCardProps) {
  const tone = getSystemCardTone(system);
  const capacityTone = getCapacityTone(system);
  const budgetTone = getBudgetTone(system);
  const hasBudget = system.allocatedBudget > 0;

  return (
    <button
      type="button"
      className={`system-card ${tone} ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >
      <div className="system-card-top">
        <div className="system-card-title">
          <strong>{system.name}</strong>

          <span>
            {system.assignedEmployeesCount} עובדים משויכים
          </span>
        </div>
      </div>

      <div
        className={`system-budget-mini ${budgetTone}`}
      >
        {hasBudget ? (
          <>
            <span>
              תקציב:{" "}
              {formatCurrency(
                system.allocatedBudget
              )}
            </span>

            <span>
              {system.budgetGap < 0
                ? "חריגה"
                : "יתרה"}
              :{" "}
              {formatCurrency(
                Math.abs(system.budgetGap)
              )}
            </span>
          </>
        ) : (
          <span>תקציב לא הוגדר</span>
        )}
      </div>

      <div className="system-card-divider" />

      <div className="system-card-metrics">
        <div>
          <span>נדרש</span>

          <strong>
            {system.requiredCapacityMonths}
          </strong>
        </div>

        <div>
          <span>מוקצה</span>

          <strong>
            {system.allocatedMonths}
          </strong>
        </div>

        <div
          className={`system-gap-metric ${capacityTone}`}
        >
          <span>פער</span>

          <strong>
            {Math.abs(system.gap)}
          </strong>
        </div>
      </div>
    </button>
  );
}