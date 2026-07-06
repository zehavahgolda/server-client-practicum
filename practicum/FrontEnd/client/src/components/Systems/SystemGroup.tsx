import { useState } from "react";
import type { System } from "../../types";
import SystemCard from "./SystemCard";
import "./SystemGroup.css";

// מאפייני קבוצת מערכות בתצוגה מקובצת.
interface SystemGroupProps {
  title: string;
  subtitle: string;
  tone: "shortage" | "balanced" | "excess";
  systems: System[];
  defaultOpen?: boolean;
  onSystemClick: (id: string) => void;
}

// מחשב סך חודשי קיבולת נדרשים בקבוצה.
function sumRequired(systems: System[]) {
  return systems.reduce((sum, system) => sum + system.requiredCapacityMonths, 0);
}

// מחשב סך חודשי קיבולת מוקצים בקבוצה.
function sumAllocated(systems: System[]) {
  return systems.reduce((sum, system) => sum + system.allocatedMonths, 0);
}

// מחשב פער מצטבר לכלל המערכות בקבוצה.
function sumGap(systems: System[]) {
  return systems.reduce((sum, system) => sum + system.gap, 0);
}

// מציג קבוצת מערכות נפתחת עם סיכום ופריטי מערכת.
export default function SystemGroup({
  title,
  subtitle,
  tone,
  systems,
  defaultOpen = false,
  onSystemClick
}: SystemGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  // נתוני סיכום לקבוצת המערכות בכותרת.
  const required = sumRequired(systems);
  const allocated = sumAllocated(systems);
  const gap = sumGap(systems);

  if (systems.length === 0) return null;

  return (
    <section className={`system-group ${tone}`}>
      <button
        type="button"
        className="system-group-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="system-group-title-wrap">
          <span className="system-group-color-line" />
          <div>
            <h3>{title}</h3>
            <p>
              {systems.length} מערכות · נדרש {required} מוקצה {allocated}
            </p>
          </div>
        </div>

        <div className="system-group-left">
          <span className={`system-group-gap ${tone}`}>
            פער {gap}
          </span>
          <span className="system-group-toggle">
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {open && (
        <div className="system-group-body">
          <p className="system-group-subtitle">{subtitle}</p>

          <div className="systems-cards-grid group-grid">
            {systems.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                selected={false}
                onClick={() => onSystemClick(system.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}