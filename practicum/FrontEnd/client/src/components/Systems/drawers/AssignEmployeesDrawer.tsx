import { useEffect, useMemo, useState } from "react";
import { assignmentService } from "../../../services/assignmentService";
import type {
  BulkAssignEmployeesDto,
  EmployeeAssignmentCandidate,
  EmployeeAssignmentItem,
  SystemDetails
} from "../../../types";
import "./AssignEmployeesDrawer.css";
import { normalizeMonthValue } from "../../../utils/months";

// מאפייני המגירה לשיבוץ עובדים למערכת.
interface AssignEmployeesDrawerProps {
  open: boolean;
  system: SystemDetails | null;
  year?: number;
  onClose: () => void;
  onAssigned: () => Promise<void> | void;
}

// מבנה הנתונים של עובדים שנבחרו לשיבוץ (employeeId -> פרטי שיבוץ).
type SelectedMap = Record<string, EmployeeAssignmentItem>;

// מחזיר תפקיד ברירת מחדל לשיבוץ לפי נתוני העובד.
function getDefaultRole(employee: EmployeeAssignmentCandidate) {
  return employee.professionalSubCategory || employee.professionalCategory || "עובד מערכת";
}

// מגביל חודשי שיבוץ לטווח חוקי בהתאם ליתרת הקיבולת של העובד.
function clampMonths(value: number, max: number) {
  return normalizeMonthValue(value, { min: 1, max });
}

// מגדיר תקרת חודשים לעריכה כך שגם עובד שכבר משויך יישאר ניתן לעדכון.
function getMaxEditableMonths(employee: EmployeeAssignmentCandidate) {
  return Math.max(1, employee.yearlyCapacityMonths);
}

// מגירת שיבוץ עובדים: טעינה, חיפוש, בחירה ושמירה מרוכזת.
export default function AssignEmployeesDrawer({
  open,
  system,
  year,
  onClose,
  onAssigned
}: AssignEmployeesDrawerProps) {
  const [employees, setEmployees] = useState<EmployeeAssignmentCandidate[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // טוען מועמדים לשיבוץ לפי מערכת/שנה/חיפוש עם debounce קצר.
  useEffect(() => {
    if (!open || !system) return;
    const currentSystem = system;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrors([]);

      try {
        const data = await assignmentService.getAssignmentCandidates({
          systemId: currentSystem.id,
          year,
          search: search.trim() || undefined
        });

        if (!cancelled) {
          setEmployees(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "שגיאה בטעינת עובדים לשיבוץ.";
          setErrors([message]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(load, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, system, year, search]);

  // מאפס מצב מקומי בכל סגירה של המגירה.
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected({});
      setErrors([]);
    }
  }, [open]);

  const selectedCount = Object.keys(selected).length;

  // מסנן עובדים מקומית לפי מחרוזת חיפוש.
  const visibleEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;

      return [
        employee.fullName,
        employee.professionalCategory,
        employee.professionalSubCategory,
        employee.managerName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [employees, search]);

  // מוסיף/מסיר עובד מרשימת העובדים שנבחרו לשיבוץ.
  function toggleEmployee(employee: EmployeeAssignmentCandidate) {
    const isBlocked = !employee.canAssign && !employee.alreadyAssignedToSystem;
    if (isBlocked) return;

    setSelected((prev) => {
      if (prev[employee.id]) {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      }

      return {
        ...prev,
        [employee.id]: {
          employeeId: employee.id,
          roleInSystem: getDefaultRole(employee),
          plannedMonths: 1,
          actualMonths: 1
        }
      };
    });
  }

  // מעדכן חודשי שיבוץ לעובד נבחר תוך שמירה על טווח תקין.
  function updateMonths(employee: EmployeeAssignmentCandidate, months: number) {
    const fixedMonths = clampMonths(months, getMaxEditableMonths(employee));

    setSelected((prev) => ({
      ...prev,
      [employee.id]: {
        ...prev[employee.id],
        plannedMonths: fixedMonths,
        actualMonths: fixedMonths
      }
    }));
  }

  // שומר את כל הבחירות בפעולה מרוכזת מול השרת.
  async function saveAssignments() {
    if (!system) return;

    const employeesToAssign = Object.values(selected);

    if (employeesToAssign.length === 0) {
      setErrors(["לא נבחרו עובדים לשיבוץ."]);
      return;
    }

    const dto: BulkAssignEmployeesDto = {
      systemId: system.id,
      employees: employeesToAssign
    };

    setSaving(true);
    setErrors([]);

    try {
      const result = await assignmentService.bulkAssignEmployees(dto);

      if (!result.isSuccess) {
        setErrors(result.errors?.length ? result.errors : ["השיבוץ נכשל."]);
        return;
      }

      await onAssigned();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "שגיאה בשמירת השיבוץ.";
      setErrors([message]);
    } finally {
      setSaving(false);
    }
  }

  if (!system) return null;

  return (
    <>
      <div className={`assign-drawer-backdrop ${open ? "show" : ""}`} onClick={onClose} />

      <aside className={`assign-drawer ${open ? "show" : ""}`} dir="rtl">
        <header className="assign-drawer-header">
          <button type="button" className="assign-close-btn" onClick={onClose}>
            ×
          </button>

          <div>
            <h2>שיבוץ עובדים — {system.name}</h2>
            <p>בחרי עובדים לשיבוץ למערכת. שינויי חודשים יחולו מיד בבחירה.</p>
          </div>
        </header>

        <div className="assign-search-wrap">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="חיפוש עובד לפי שם, תחום או מנהל"
            autoFocus
          />
        </div>

        {errors.length > 0 && (
          <div className="assign-errors">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <div className="assign-list">
          {loading && <div className="assign-empty">טוען עובדים...</div>}

          {!loading &&
            visibleEmployees.map((employee) => {
              const isSelected = Boolean(selected[employee.id]);
              const selectedData = selected[employee.id];
              const isBlocked = !employee.canAssign && !employee.alreadyAssignedToSystem;

              return (
                <button
                  type="button"
                  key={employee.id}
                  className={`assign-employee-row ${isSelected ? "selected" : ""} ${
                    isBlocked ? "disabled" : ""
                  }`}
                  onClick={() => toggleEmployee(employee)}
                >
                  <span className="assign-checkbox">{isSelected ? "✓" : ""}</span>

                  <div className="assign-employee-main">
                    <strong>{employee.fullName}</strong>
                    <span>
                      {employee.professionalCategory}
                      {employee.professionalSubCategory ? ` · ${employee.professionalSubCategory}` : ""}
                      {" · "}
                      מנהל: {employee.managerName}
                    </span>

                    {employee.alreadyAssignedToSystem && (
                      <small>העובד כבר משויך למערכת זו</small>
                    )}

                    {!employee.alreadyAssignedToSystem && employee.remainingMonths <= 0 && (
                      <small>אין יתרת קיבולת לשיבוץ</small>
                    )}
                  </div>

                  <div className="assign-stats">
                    <div>
                      <span>קיבולת</span>
                      <strong>{employee.yearlyCapacityMonths}</strong>
                    </div>

                    <div>
                      <span>מנוצל</span>
                      <strong>{employee.allocatedMonths}</strong>
                    </div>

                    <div>
                      <span>יתרה</span>
                      <strong className={employee.remainingMonths > 0 ? "ok" : "danger"}>
                        {employee.remainingMonths}
                      </strong>
                    </div>

                    {isSelected && (
                      <label className="assign-months" onClick={(event) => event.stopPropagation()}>
                        חודשים
                        <input
                          type="number"
                          min={1}
                          step={0.5}
                          max={getMaxEditableMonths(employee)}
                          value={selectedData.actualMonths}
                          onChange={(event) =>
                            updateMonths(employee, Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                  </div>
                </button>
              );
            })}

          {!loading && visibleEmployees.length === 0 && (
            <div className="assign-empty">לא נמצאו עובדים מתאימים.</div>
          )}
        </div>

        <footer className="assign-drawer-footer">
          <span>{selectedCount} עובדים נבחרו</span>

          <div>
            <button type="button" className="secondary-btn" onClick={onClose}>
              ביטול
            </button>

            <button
              type="button"
              className="primary-btn"
              disabled={saving || selectedCount === 0}
              onClick={saveAssignments}
            >
              {saving ? "משבץ..." : "שיבוץ נבחרים"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}