// src/utils/numberFormatters.ts

// ממיר ערך מספרי לאחוז שלם ומוסיף סימן אחוז.
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// מעצב ערך מספרי, כולל תמיכה בערכי חצי חודש.
export function formatMetricValue(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

// מעצב סכום כספי בשקלים ללא ספרות אחרי הנקודה.
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}