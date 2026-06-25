import type { System } from "../../types";
import "./SystemCard.css";

interface SystemCardProps {
  system: System;
  selected?: boolean;
  onClick: () => void;
}

function getTone(system: System) {
  if (system.gap > 0) return "shortage";
  if (system.gap < 0) return "excess";
  return "balanced";
}

function getStatusLabel(system: System) {
  if (system.gap > 0) return "Shortage";
  if (system.gap < 0) return "Excess";
  return "Balanced";
}

export default function SystemCard({ system, selected = false, onClick }: SystemCardProps) {
  const tone = getTone(system);

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

        <span className={`system-status-pill ${tone}`}>
          {getStatusLabel(system)}
        </span>
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

        <div>
          <span>פער</span>
          <strong className={tone}>{Math.abs(system.gap)}</strong>
        </div>
      </div>
    </button>
  );
}