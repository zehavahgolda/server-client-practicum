import type { ReactNode } from "react";

// מגדיר את ה-props של כרטיס KPI: כותרת, ערך, סטטוס, אייקון ואירוע לחיצה אופציונלי.
interface KPICardProps {
  label: string;
  value: number | string;
  status?: "ok" | "warn" | "danger";
  onClick?: () => void;
  icon?: ReactNode;
}

// קומפוננטת כרטיס KPI להצגה מהירה של מדד יחיד עם צבע סטטוס ואפשרות לאינטראקציה.
export function KPICard({ label, value, status, onClick, icon }: KPICardProps) {
  const statusClass = {
    ok: "kpi-ok",
    warn: "kpi-warn",
    danger: "kpi-danger"
  }[status || "ok"];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`kpi-card ${statusClass} ${onClick ? "cursor-pointer" : ""}`}

      aria-label={label}
    >
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </button>
  );
}
