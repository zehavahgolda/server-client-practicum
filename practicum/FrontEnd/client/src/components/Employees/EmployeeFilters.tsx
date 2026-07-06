import type { Dispatch, SetStateAction } from "react";
import type { EmployeeFilters as EmployeeFiltersType } from "../../types";
import "./EmployeeFilters.css";

// שנה נוכחית ואפשרויות סינון סביב השנה הפעילה.
const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

// מאפייני סרגל הפילטרים והפעולות במסך עובדים.
interface EmployeeFiltersProps {
  filters: EmployeeFiltersType;
  categories: string[];
  managers: string[];
  total: number;
  lowCapacity: number;
  overloaded: number;
  onChangeFilters: Dispatch<SetStateAction<EmployeeFiltersType>>;
  onCreateEmployee: () => void;
  onClearFilters: () => void;
}

// סרגל פילטרים, פעולות וסטטיסטיקות להצגת רשימת עובדים.
export default function EmployeeFilters({
  filters,
  categories,
  managers,
  total,
  lowCapacity,
  overloaded,
  onChangeFilters,
  onCreateEmployee,
  onClearFilters
}: EmployeeFiltersProps) {
  return (
    <section className="employees-toolbar-card">
      <div className="employees-filter-row">
        <label>
          שנה
          <select
            value={filters.year ?? 2026}
            onChange={(event) =>
              onChangeFilters((prev) => ({
                ...prev,
                year: Number(event.target.value)
              }))
            }
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>

        <label>
          קטגוריה
          <select
            value={filters.professionalCategory ?? ""}
            onChange={(event) =>
              onChangeFilters((prev) => ({
                ...prev,
                professionalCategory: event.target.value || undefined
              }))
            }
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          מנהל
          <select
            value={filters.managerName ?? ""}
            onChange={(event) =>
              onChangeFilters((prev) => ({
                ...prev,
                managerName: event.target.value || undefined
              }))
            }
          >
            <option value="">כל המנהלים</option>
            {managers.map((manager) => (
              <option key={manager} value={manager}>
                {manager}
              </option>
            ))}
          </select>
        </label>

        <label className="employees-search-label">
          חיפוש
          <input
            value={filters.search ?? ""}
            onChange={(event) =>
              onChangeFilters((prev) => ({
                ...prev,
                search: event.target.value
              }))
            }
            placeholder="חיפוש עובד לפי שם, מנהל או תחום"
          />
        </label>

        <button type="button" className="secondary-btn clean-btn" onClick={onClearFilters}>
          ניקוי
        </button>
      </div>

      <div className="employees-toolbar-divider" />

      <div className="employees-actions-row">
        <span>פעולות</span>

        <button type="button" className="primary-btn" onClick={onCreateEmployee}>
          + הוספת עובד
        </button>
      </div>

      <div className="employees-stats-row">
        <span className="employee-stat-pill neutral">סה״כ: {total}</span>
        <span className="employee-stat-pill warning">בלחץ: {lowCapacity}</span>
        <span className="employee-stat-pill danger">עומס יתר: {overloaded}</span>
      </div>
    </section>
  );
}