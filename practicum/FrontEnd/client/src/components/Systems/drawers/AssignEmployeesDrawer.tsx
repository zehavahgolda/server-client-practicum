import type {
  EmployeeAssignmentCandidate,
  SystemDetails
} from "../../../types";

import { useAssignEmployeesDrawerState } from "../../../hooks/useAssignEmployeesDrawerState";
import { normalizeMonthValue } from "../../../utils/months";
import { formatMetricValue } from "../../../utils/numberFormatters";

import "./AssignEmployeesDrawer.css";

// מאפייני המגירה לשיבוץ עובדים למערכת.
interface AssignEmployeesDrawerProps {
  open: boolean;
  system: SystemDetails | null;
  year?: number;
  onClose: () => void;
  onAssigned: () => Promise<void> | void;
}

// מחזיר תפקיד ברירת מחדל לשיבוץ לפי נתוני העובד.
function getDefaultRole(
  employee: EmployeeAssignmentCandidate
): string {
  return (
    employee.professionalSubCategory ||
    employee.professionalCategory ||
    "עובד מערכת"
  );
}

// מגביל את מספר חודשי השיבוץ לטווח החוקי שהשרת חישב.
function clampMonths(value: number, max: number): number {
  return normalizeMonthValue(value, {
    min: 0.5,
    max
  });
}

// מגירת שיבוץ עובדים: טעינה, חיפוש, בחירה ושמירה מרוכזת.
export default function AssignEmployeesDrawer({
  open,
  system,
  year,
  onClose,
  onAssigned
}: AssignEmployeesDrawerProps) {
  const {
    selected,
    search,
    loading,
    saving,
    errors,
    visibleEmployees,
    selectedCount,
    setSearch,
    toggleEmployee,
    updateMonths,
    saveAssignments
  } = useAssignEmployeesDrawerState({
    open,
    system,
    year,
    onClose,
    onAssigned,
    getDefaultRole,
    clampMonths
  });

  if (!system) {
    return null;
  }

  return (
    <>
      <div
        className={`assign-drawer-backdrop ${open ? "show" : ""}`}
        onClick={onClose}
      />

      <aside
        className={`assign-drawer ${open ? "show" : ""}`}
        dir="rtl"
      >
        <header className="assign-drawer-header">
          <button
            type="button"
            className="assign-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>

          <div>
            <h2>שיבוץ עובדים — {system.name}</h2>

            <p>
              ניתן לשבץ עובדים חדשים או לעדכן את מספר החודשים של
              עובדים שכבר משויכים למערכת.
            </p>
          </div>
        </header>

        <div className="assign-search-wrap">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="חיפוש עובד לפי שם, תחום או מנהל"
            autoFocus
            disabled={saving}
          />
        </div>

        {errors.length > 0 && (
          <div className="assign-errors">
            {errors.map((error, index) => (
              <div key={`${error}-${index}`}>{error}</div>
            ))}
          </div>
        )}

        <div className="assign-list">
          {loading && (
            <div className="assign-empty">
              טוען עובדים...
            </div>
          )}

          {!loading &&
            visibleEmployees.map((employee) => {
              const isSelected = Boolean(
                selected[employee.id]
              );

              const selectedData =
                selected[employee.id];

              const isBlocked = !employee.canAssign;

              return (
                <button
                  type="button"
                  key={employee.id}
                  className={`assign-employee-row ${
                    isSelected ? "selected" : ""
                  } ${isBlocked ? "disabled" : ""}`}
                  onClick={() => toggleEmployee(employee)}
                  disabled={saving || isBlocked}
                >
                  <span className="assign-checkbox">
                    {isSelected ? "✓" : ""}
                  </span>

                  <div className="assign-employee-main">
                    <strong>{employee.fullName}</strong>

                    <span>
                      {employee.professionalCategory}

                      {employee.professionalSubCategory
                        ? ` · ${employee.professionalSubCategory}`
                        : ""}

                      {" · "}
                      מנהל: {employee.managerName}
                    </span>

                    {employee.alreadyAssignedToSystem && (
                      <small>
                        העובד כבר משויך למערכת זו ב־
                        {formatMetricValue(
                          employee.currentSystemMonths
                        )}{" "}
                        חודשים. ניתן לעדכן את ההקצאה.
                      </small>
                    )}

                    {!employee.alreadyAssignedToSystem &&
                      !employee.canAssign && (
                        <small>
                          אין לעובד קיבולת פנויה לשיבוץ.
                        </small>
                      )}
                  </div>

                  <div className="assign-stats">
                    <div>
                      <span>קיבולת</span>
                      <strong>
                        {formatMetricValue(
                          employee.yearlyCapacityMonths
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>מוקצה כולל</span>
                      <strong>
                        {formatMetricValue(
                          employee.allocatedMonths
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>פנוי כעת</span>
                      <strong
                        className={
                          employee.remainingMonths > 0
                            ? "ok"
                            : "danger"
                        }
                      >
                        {formatMetricValue(
                          employee.remainingMonths
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>במערכת זו</span>
                      <strong>
                        {formatMetricValue(
                          employee.currentSystemMonths
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>ניתן להקצות עד</span>
                      <strong
                        className={
                          employee.maxAssignableMonths > 0
                            ? "ok"
                            : "danger"
                        }
                      >
                        {formatMetricValue(
                          employee.maxAssignableMonths
                        )}
                      </strong>
                    </div>

                    {isSelected && selectedData && (
                      <label
                        className="assign-months"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        חודשים לשיבוץ

                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          max={
                            employee.maxAssignableMonths
                          }
                          value={selectedData.actualMonths}
                          onChange={(event) =>
                            updateMonths(
                              employee,
                              Number(event.target.value)
                            )
                          }
                          disabled={saving}
                        />
                      </label>
                    )}
                  </div>
                </button>
              );
            })}

          {!loading &&
            visibleEmployees.length === 0 && (
              <div className="assign-empty">
                לא נמצאו עובדים מתאימים.
              </div>
            )}
        </div>

        <footer className="assign-drawer-footer">
          <span>
            {selectedCount} עובדים נבחרו לשיבוץ או לעדכון
          </span>

          <div>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </button>

            <button
              type="button"
              className="primary-btn"
              disabled={
                saving || selectedCount === 0
              }
              onClick={() => void saveAssignments()}
            >
              {saving
                ? "שומר שיבוצים..."
                : "שמירת שיבוצים"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}