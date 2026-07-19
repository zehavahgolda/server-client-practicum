import {
  useEffect,
  useRef,
  useState,
  type CSSProperties
} from "react";

import type { EmployeeListItem } from "../../../types";

import EmployeeCard from "../cards/EmployeeCard";

import "./EmployeeGroup.css";

// סוגי הצבע האפשריים של קבוצת עובדים.
type EmployeeGroupTone =
  | "available"
  | "balanced"
  | "overloaded"
  | "category";

// מאפייני קבוצת עובדים:
// כותרת, רשימה, בחירה, צבע אופציונלי
// ומצב פתיחה אוטומטי.
interface Props {
  title: string;
  subtitle?: string;
  tone: EmployeeGroupTone;
  accentColor?: string;
  employees: EmployeeListItem[];
  selectedEmployeeId?: string;
  defaultOpen?: boolean;
  onSelectEmployee: (id: string) => void;
}

// טיפוס המאפשר להעביר משתנה CSS מקומי לקבוצה.
type EmployeeGroupStyle = CSSProperties & {
  "--employee-group-accent"?: string;
};

// מציג קבוצת עובדים נפתחת עם כרטיסי העובדים השייכים אליה.
export default function EmployeeGroup({
  title,
  subtitle,
  tone,
  accentColor,
  employees,
  selectedEmployeeId,
  defaultOpen = false,
  onSelectEmployee
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const groupRef =
    useRef<HTMLElement | null>(null);

  // מסנכרן את מצב הפתיחה כאשר מגיעים
  // לקטגוריה דרך קישור מהדשבורד.
  //
  // אם זו הקטגוריה שנבחרה, הקבוצה נפתחת
  // והעמוד גולל אליה אוטומטית כדי שהמשתמש
  // יראה מיד לאן הגיע.
  useEffect(() => {
    setOpen(defaultOpen);

    if (!defaultOpen) {
      return;
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        groupRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      });

    return () => {
      window.cancelAnimationFrame(
        animationFrameId
      );
    };
  }, [defaultOpen]);

  if (employees.length === 0) {
    return null;
  }

  const groupStyle:
    | EmployeeGroupStyle
    | undefined = accentColor
    ? {
        "--employee-group-accent": accentColor
      }
    : undefined;

  return (
    <section
      ref={groupRef}
      className={`employee-group ${tone}`}
      style={groupStyle}
    >
      <button
        type="button"
        className="employee-group-header"
        onClick={() =>
          setOpen(
            (previousOpen) => !previousOpen
          )
        }
        aria-expanded={open}
      >
        <div className="employee-group-title-wrap">
          <span
            className="employee-group-color-line"
            aria-hidden="true"
          />

          <div>
            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}

            <span>
              {employees.length} עובדים
            </span>
          </div>
        </div>

        <div className="employee-group-left">
          <span
            className="employee-group-toggle"
            aria-hidden="true"
          >
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {open && (
        <div className="employee-group-body">
          <div className="employees-cards-grid employee-group-grid">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                selected={
                  employee.id ===
                  selectedEmployeeId
                }
                onClick={() =>
                  onSelectEmployee(employee.id)
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}