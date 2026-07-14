import { useMemo, useState } from "react";

import type { EmployeeListItem } from "../../../types";

import EmployeeCard from "../cards/EmployeeCard";

import "./EmployeeGroup.css";

// מאפייני קבוצת עובדים (כותרת, רשימה ובחירה).
interface Props {
  title: string;
  subtitle?: string;
  tone: "available" | "balanced" | "overloaded";
  employees: EmployeeListItem[];
  selectedEmployeeId?: string;
  defaultOpen?: boolean;
  onSelectEmployee: (id: string) => void;
}

// מציג קבוצת עובדים נפתחת עם סיכום מהיר לפי זמינות.
export default function EmployeeGroup({
  title,
  subtitle,
  tone,
  employees,
  selectedEmployeeId,
  defaultOpen = false,
  onSelectEmployee
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // מחשב סיכום זמינות עבור גוף הקבוצה.
  const summary = useMemo(() => {
    const available = employees.filter(
      (employee) => employee.remainingMonths > 0
    ).length;

    const balanced = employees.filter(
      (employee) => employee.remainingMonths === 0
    ).length;

    const overloaded = employees.filter(
      (employee) => employee.remainingMonths < 0
    ).length;

    return {
      available,
      balanced,
      overloaded
    };
  }, [employees]);

  if (employees.length === 0) {
    return null;
  }

  return (
    <section className={`employee-group ${tone}`}>
      <button
        type="button"
        className="employee-group-header"
        onClick={() => setOpen((previousOpen) => !previousOpen)}
      >
        <div className="employee-group-title-wrap">
          <span className="employee-group-color-line" />

          <div>
            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}

            <span>{employees.length} עובדים</span>
          </div>
        </div>

        <div className="employee-group-left">
          <span className="employee-group-toggle">
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {open && (
        <div className="employee-group-body">
          <div className="employee-group-summary">
            <span className="available">
              {summary.available} זמינים
            </span>

            <span className="balanced">
              {summary.balanced} מלאים
            </span>

            <span className="overloaded">
              {summary.overloaded} עומס יתר
            </span>
          </div>

          <div className="employees-cards-grid employee-group-grid">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                selected={employee.id === selectedEmployeeId}
                onClick={() => onSelectEmployee(employee.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}