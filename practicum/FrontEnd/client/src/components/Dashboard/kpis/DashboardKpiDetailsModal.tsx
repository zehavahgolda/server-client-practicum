import { useMemo, useState } from "react";
import type { System } from "../../../types";
import DashboardSystemRow from "../systems/DashboardSystemRow";
import "./DashboardKpiDetailsModal.css";

export type DashboardKpiModalMode =
  | "shortage-count"
  | "missing-months"
  | "capacity-gap"
  | "budget";

interface DashboardKpiDetailsModalProps {
  open: boolean;
  mode: DashboardKpiModalMode;
  systems: System[];
  onClose: () => void;
  onAssign: (system: System) => void;
  onEdit: (system: System) => void;
  onOpenProfile: (system: System) => void;
}

function getConfig(mode: DashboardKpiModalMode) {
  switch (mode) {
    case "budget":
      return {
        title: "תמונת מצב תקציבית",
        description: "רשימת המערכות ומצב ניצול התקציב.",
        showBudget: true
      };
    case "missing-months":
      return {
        title: "חודשי עבודה חסרים",
        description: "מערכות שבהן ההקצאה נמוכה מהדרישה.",
        showBudget: false
      };
    case "capacity-gap":
      return {
        title: "פערי קיבולת",
        description: "ממויין לפי הפער הגדול ביותר.",
        showBudget: false
      };
    default:
      return {
        title: "מערכות הדורשות שיבוץ כוח אדם",
        description: "בחרי מערכת כדי לשבץ עובדים, לערוך או לפתוח פרופיל.",
        showBudget: false
      };
  }
}

export default function DashboardKpiDetailsModal({
  open,
  mode,
  systems,
  onClose,
  onAssign,
  onEdit,
  onOpenProfile
}: DashboardKpiDetailsModalProps) {
  const [search, setSearch] = useState("");
  const config = getConfig(mode);

  const visibleSystems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...systems]
      .filter(s => !q || s.name.toLowerCase().includes(q))
      .sort((a,b)=> b.gap - a.gap);
  }, [systems, search]);

  if (!open) return null;

  return (
    <div className="modal-overlay dashboard-kpi-modal-overlay" onClick={onClose}>
      <section
        className="modal-card dashboard-kpi-modal-card"
        dir="rtl"
        onClick={(e)=>e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
        >
          ×
        </button>

        <header className="dashboard-kpi-modal-header">
          <div>
            <h2>{config.title}</h2>
            <p>{config.description}</p>
          </div>

          <span className="dashboard-kpi-modal-count">
            {visibleSystems.length} מערכות
          </span>
        </header>

        <div className="dashboard-kpi-toolbar">
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="חיפוש מערכת..."
          />
        </div>

        <div className="dashboard-kpi-list">
          {visibleSystems.map(system=>(
            <DashboardSystemRow
              key={system.id}
              system={system}
              showBudget={config.showBudget}
              onAssign={onAssign}
              onEdit={onEdit}
              onOpenProfile={onOpenProfile}
            />
          ))}

          {visibleSystems.length===0 && (
            <div className="empty-text">
              אין מערכות להצגה.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}