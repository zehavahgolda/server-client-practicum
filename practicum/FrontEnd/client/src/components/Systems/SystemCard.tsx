import type { System } from "../../types";
import "./SystemCard.css";

// מאפייני כרטיס מערכת בודדת.
interface SystemCardProps {
  system: System;
  selected?: boolean;
  onClick: () => void;
}

type SystemCardTone = "shortage" | "excess" | "balanced" | "neutral";
type CapacityTone = "shortage" | "excess" | "balanced";

// קובע את מצב החודשים בלבד לפי פער הקיבולת.
function getCapacityTone(system: System): CapacityTone {
  if (system.gap > 0) return "shortage";
  if (system.gap < 0) return "excess";
  return "balanced";
}

// קובע את המצב הכולל של הכרטיס.
//
// ירוק יוצג רק כאשר:
// 1. הוגדר תקציב.
// 2. אין חריגה תקציבית.
// 3. אין מחסור בחודשי עבודה.
export function getSystemCardTone(system: System): SystemCardTone {
  const hasBudget = system.allocatedBudget > 0;
  const budgetIsHealthy = hasBudget && system.budgetGap >= 0;
  const capacityIsHealthy = system.gap <= 0;

  if (!hasBudget) return "neutral";

  if (!budgetIsHealthy || !capacityIsHealthy) {
    return "shortage";
  }

  if (system.gap < 0) {
    return "excess";
  }

  return "balanced";
}

// מחזיר תיאור קצר למצב החודשים שמופיע באזור המדדים התחתון.
function getCapacityLabel(system: System) {
  if (system.gap > 0) return "חוסר";
  if (system.gap < 0) return "עודף תקין";
  return "מאוזן";
}

// קובע טון תקציבי לפי מצב התקציב והחריגה.
function getBudgetTone(system: System) {
  if (!system.allocatedBudget || system.allocatedBudget <= 0) {
    return "neutral";
  }

  if (system.budgetGap < 0) {
    return "shortage";
  }

  return "balanced";
}

// מעצב סכום כספי לפי פורמט מטבע ישראלי.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

// מציג כרטיס מערכת עם נתוני קיבולת ותקציב תמציתיים.
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
      className={`system-card ${tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="system-card-top">
        <div className="system-card-title">
          <strong>{system.name}</strong>
          <span>{system.assignedEmployeesCount} עובדים משויכים</span>
        </div>
      </div>

      <div className={`system-budget-mini ${budgetTone}`}>
        {hasBudget ? (
          <>
            <span>
              תקציב: {formatCurrency(system.allocatedBudget)}
            </span>

            <span>
              {system.budgetGap < 0 ? "חריגה" : "יתרה"}:{" "}
              {formatCurrency(Math.abs(system.budgetGap))}
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
          <strong>{system.requiredCapacityMonths}</strong>
        </div>

        <div>
          <span>מוקצה</span>
          <strong>{system.allocatedMonths}</strong>
        </div>

        <div className={`system-gap-metric ${capacityTone}`}>
          <span>פער</span>
          <strong>{Math.abs(system.gap)}</strong>
          <small>{getCapacityLabel(system)}</small>
        </div>
      </div>
    </button>
  );
}