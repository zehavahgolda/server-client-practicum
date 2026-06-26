import type { EmployeeFilters as EmployeeFiltersType } from "../../types";

interface EmployeeFiltersProps {
  filters: EmployeeFiltersType;
  categories: string[];
  managers: string[];
  total: number;
  lowCapacity: number;
  overloaded: number;
  onChangeFilters: React.Dispatch<React.SetStateAction<EmployeeFiltersType>>;
  onCreateEmployee: () => void;
  onClearFilters: () => void;
}

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
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2027}>2027</option>
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