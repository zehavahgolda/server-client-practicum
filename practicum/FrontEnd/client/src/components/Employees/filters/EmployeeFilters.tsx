import type { Dispatch, SetStateAction } from "react";

import type {
  EmployeeFilters as EmployeeFiltersType
} from "../../../types";

import UnifiedToolbar from "../../shared/navigation/UnifiedToolbar";

import "./EmployeeFilters.css";

// שנה נוכחית ואפשרויות סינון סביב השנה הפעילה.
const currentYear = new Date().getFullYear();

const yearOptions = [
  currentYear - 1,
  currentYear,
  currentYear + 1
];

// מאפייני סרגל הפילטרים והפעולות במסך עובדים.
interface EmployeeFiltersProps {
  filters: EmployeeFiltersType;
  categories: string[];
  managers: string[];
  viewMode: "all" | "status" | "category";
  available: number;
  balanced: number;
  overloaded: number;
  onChangeFilters: Dispatch<
    SetStateAction<EmployeeFiltersType>
  >;
  onChangeViewMode: (
    mode: "all" | "status" | "category"
  ) => void;
  onCreateEmployee: () => void;
  onClearFilters: () => void;
}

// סרגל פילטרים, פעולות וסטטיסטיקות להצגת רשימת עובדים.
export default function EmployeeFilters({
  filters,
  categories,
  managers,
  viewMode,
  available,
  balanced,
  overloaded,
  onChangeFilters,
  onChangeViewMode,
  onCreateEmployee,
  onClearFilters
}: EmployeeFiltersProps) {
  return (
    <UnifiedToolbar
      filters={
        <>
          <label>
            שנה
            <select
              value={filters.year ?? currentYear}
              onChange={(event) =>
                onChangeFilters((previousFilters) => ({
                  ...previousFilters,
                  year: Number(event.target.value)
                }))
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            קטגוריה
            <select
              value={
                filters.professionalCategory ?? ""
              }
              onChange={(event) =>
                onChangeFilters((previousFilters) => ({
                  ...previousFilters,
                  professionalCategory:
                    event.target.value || undefined
                }))
              }
            >
              <option value="">
                כל הקטגוריות
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
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
                onChangeFilters((previousFilters) => ({
                  ...previousFilters,
                  managerName:
                    event.target.value || undefined
                }))
              }
            >
              <option value="">
                כל המנהלים
              </option>

              {managers.map((manager) => (
                <option
                  key={manager}
                  value={manager}
                >
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
                onChangeFilters((previousFilters) => ({
                  ...previousFilters,
                  search: event.target.value
                }))
              }
              placeholder="חיפוש עובד לפי שם, מנהל או תחום"
            />
          </label>

          <button
            type="button"
            className="secondary-btn unified-clean-btn"
            onClick={onClearFilters}
          >
            ניקוי
          </button>
        </>
      }
      summary={
        <>
          {available > 0 && (
            <span className="unified-stat-pill green">
              זמין: {available}
            </span>
          )}

          {balanced > 0 && (
            <span className="unified-stat-pill warning">
              מלא: {balanced}
            </span>
          )}

          {overloaded > 0 && (
            <span className="unified-stat-pill danger">
              עומס יתר: {overloaded}
            </span>
          )}
        </>
      }
      grouping={
        <>
          <button
            type="button"
            className={`unified-view-pill ${
              viewMode === "all" ? "active" : ""
            }`}
            onClick={() => onChangeViewMode("all")}
          >
            כל העובדים
          </button>

          <button
            type="button"
            className={`unified-view-pill ${
              viewMode === "status" ? "active" : ""
            }`}
            onClick={() =>
              onChangeViewMode("status")
            }
          >
            קיבוץ לפי זמינות
          </button>

          <button
            type="button"
            className={`unified-view-pill ${
              viewMode === "category"
                ? "active"
                : ""
            }`}
            onClick={() =>
              onChangeViewMode("category")
            }
          >
            קיבוץ לפי תת־קטגוריה
          </button>
        </>
      }
      actionButton={
        <button
          type="button"
          className="primary-btn"
          onClick={onCreateEmployee}
        >
          + הוספת עובד
        </button>
      }
    />
  );
}