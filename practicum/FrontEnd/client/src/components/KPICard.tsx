import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: number | string;
  status?: "ok" | "warn" | "danger";
  onClick?: () => void;
  icon?: ReactNode;
}

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
