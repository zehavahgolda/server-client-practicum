import { useMemo, useState } from "react";
import type { EmployeeListItem } from "../../types";
import EmployeeCard from "./EmployeeCard";
import "./EmployeeGroup.css";

// מאפייני קבוצת עובדים (כותרת, רשימה ובחירה).
interface Props {
  title: string;
  employees: EmployeeListItem[];
  selectedEmployeeId?: string;
  defaultOpen?: boolean;
  onSelectEmployee: (id: string) => void;
}

// מציג קבוצת עובדים נפתחת עם סיכום מהיר לפי זמינות.
export default function EmployeeGroup({
  title,
  employees,
  selectedEmployeeId,
  defaultOpen = false,
  onSelectEmployee
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // מחשב סיכום זמינות עבור כותרת הקבוצה.
  const summary = useMemo(() => {
    const available = employees.filter((e) => e.remainingMonths > 0).length;
    const balanced = employees.filter((e) => e.remainingMonths === 0).length;
    const overloaded = employees.filter((e) => e.remainingMonths < 0).length;

    return {
      available,
      balanced,
      overloaded
    };
  }, [employees]);

  return (
    <section className="employee-group">

      <button
        type="button"
        className="employee-group-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <h2>{title}</h2>
          <span>{employees.length} עובדים</span>
        </div>

        <div className="employee-group-summary">

          <span className="available">
            {summary.available} זמינים
          </span>

          <span className="balanced">
            {summary.balanced} מלאים
          </span>

          <span className="overloaded">
            {summary.overloaded} עומס
          </span>

          <strong>{open ? "−" : "+"}</strong>

        </div>
      </button>

      {open && (

        <div className="employee-group-grid">

          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              selected={employee.id === selectedEmployeeId}
              onClick={() => onSelectEmployee(employee.id)}
            />
          ))}

        </div>

      )}

    </section>
  );
}