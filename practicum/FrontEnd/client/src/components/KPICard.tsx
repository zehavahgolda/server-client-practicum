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
    ok: "border-green-600 bg-green-50",
    warn: "border-orange-600 bg-orange-50",
    danger: "border-red-600 bg-red-50"
  }[status || "ok"];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`kpi-card ${statusClass} ${onClick ? "cursor-pointer" : ""}`}
    >
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </button>
  );
}
