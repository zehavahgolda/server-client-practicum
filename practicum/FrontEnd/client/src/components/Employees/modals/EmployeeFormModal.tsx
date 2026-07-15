import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import type {
  EmployeeDetails,
  EmployeeUpsertPayload
} from "../../../types";

const MAX_MONTHS = 12;

// מצב הטופס הפנימי ליצירה/עריכה של עובד.
type EmployeeFormState = {
  fullName: string;
  professionalCategory: string;
  professionalSubCategory: string;
  managerName: string;
  year: string;
  yearlyCapacityMonths: string;
};

// ערכי ברירת מחדל לטופס יצירת עובד.
const emptyForm: EmployeeFormState = {
  fullName: "",
  professionalCategory: "",
  professionalSubCategory: "",
  managerName: "",
  year: "2026",
  yearlyCapacityMonths: "12"
};

// מגביל קלט חודשי עבודה לטווח תקין 0-12.
function clampMonthsInput(value: string): string {
  if (value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  if (numericValue < 0) {
    return "0";
  }

  if (numericValue > MAX_MONTHS) {
    return String(MAX_MONTHS);
  }

  return value;
}

// מאפייני מודל יצירה/עריכה של עובד.
interface EmployeeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  employee: EmployeeDetails | null;
  saving: boolean;
  onClose: () => void;
  onManageAvailability?: (employee: EmployeeDetails) => void;
  onSubmit: (payload: EmployeeUpsertPayload) => Promise<void>;
}

// מודל לניהול יצירה/עריכה של עובד כולל ולידציה ושליחת payload.
export default function EmployeeFormModal({
  open,
  mode,
  employee,
  saving,
  onClose,
  onManageAvailability,
  onSubmit
}: EmployeeFormModalProps) {
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);

  // מאתחל את הטופס לפי מצב פתיחה: עריכה קיימת או יצירה חדשה.
  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && employee) {
      setForm({
        fullName: employee.fullName ?? "",
        professionalCategory:
          employee.professionalCategory ?? "",
        professionalSubCategory:
          employee.professionalSubCategory ?? "",
        managerName: employee.managerName ?? "",
        year: String(employee.year ?? 2026),
        yearlyCapacityMonths: String(employee.yearlyCapacityMonths ?? 12)
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, employee]);

  // מחשב סך הקצאות מתוכננות לצורך התרעת חריגה בקיבולת בעריכה.
  const plannedAllocationTotal = useMemo(() => {
    if (mode !== "edit" || !employee) {
      return 0;
    }

    return employee.allocations.reduce(
      (sum, allocation) =>
        sum + allocation.plannedMonths,
      0
    );
  }, [mode, employee]);

  const capacityMonths =
    Number(form.yearlyCapacityMonths) || 0;

  const isPlannedOverCapacity =
    mode === "edit" &&
    plannedAllocationTotal > capacityMonths;

  if (!open) {
    return null;
  }

  // מאמת שדות חובה וטווחים, ואז שולח את העובד לשמירה.
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const professionalCategory =
      form.professionalCategory.trim();
    const managerName = form.managerName.trim();
    const year = Number(form.year);
    const yearlyCapacityMonths =
      Number(form.yearlyCapacityMonths);

    if (
      !fullName ||
      !professionalCategory ||
      !managerName
    ) {
      return;
    }

    if (
      Number.isNaN(year) ||
      Number.isNaN(yearlyCapacityMonths) ||
      yearlyCapacityMonths < 0 ||
      yearlyCapacityMonths > MAX_MONTHS
    ) {
      return;
    }

    await onSubmit({
      fullName,
      professionalCategory,
      professionalSubCategory:
        form.professionalSubCategory.trim() || undefined,
      managerName,
      year,
      yearlyCapacityMonths
    });
  }

  function handleGoToAvailability() {
    if (saving || !employee) return;
    onClose();
    onManageAvailability?.(employee);
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card employee-modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          disabled={saving}
        >
          ×
        </button>

        <div className="modal-header">
          <h3>
            {mode === "edit"
              ? "עריכת עובד"
              : "הוספת עובד"}
          </h3>
        </div>

        <form
          className="modal-form"
          onSubmit={handleSubmit}
        >
          <section className="modal-section">
            <h4 className="modal-section-title">
              פרופיל עובד
            </h4>

            <div className="form-grid">
              <label>
                שם מלא
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      fullName: event.target.value
                    }))
                  }
                  required
                  disabled={saving}
                />
              </label>

              <label>
                קטגוריה מקצועית
                <input
                  value={
                    form.professionalCategory
                  }
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      professionalCategory:
                        event.target.value
                    }))
                  }
                  required
                  disabled={saving}
                />
              </label>

              <label>
                מנהל
                <input
                  value={form.managerName}
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      managerName:
                        event.target.value
                    }))
                  }
                  required
                  disabled={saving}
                />
              </label>

              <label>
                תת תחום
                <input
                  value={
                    form.professionalSubCategory
                  }
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      professionalSubCategory:
                        event.target.value
                    }))
                  }
                  disabled={saving}
                />
              </label>
            </div>
          </section>

          <section className="modal-section">
            <div className="employee-form-capacity-header-row">
              <h4 className="modal-section-title">קיבולת וזמינות</h4>

              {mode === "edit" && employee && (
                <button
                  type="button"
                  className="employee-form-availability-link"
                  onClick={handleGoToAvailability}
                  disabled={saving}
                  title="ניהול זמינות בפרופיל"
                  aria-label="ניהול זמינות בפרופיל"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="8" y1="3" x2="8" y2="7" />
                    <line x1="16" y1="3" x2="16" y2="7" />
                  </svg>
                  ניהול זמינות ואירועים
                  <span aria-hidden="true">←</span>
                </button>
              )}
            </div>

            <div className="form-grid">
              <label>
                קיבולת שנתית
                <input
                  type="number"
                  min={0}
                  max={MAX_MONTHS}
                  value={
                    form.yearlyCapacityMonths
                  }
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      yearlyCapacityMonths:
                        clampMonthsInput(
                          event.target.value
                        )
                    }))
                  }
                  required
                  disabled={saving}
                />
              </label>

              <label>
                שנה
                <input
                  type="number"
                  min={2020}
                  value={form.year}
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      year: event.target.value
                    }))
                  }
                  required
                  disabled={saving}
                />
              </label>
            </div>
          </section>

          {mode === "edit" && employee && (
            <section className="modal-section">
              <h4 className="modal-section-title">
                הקצאות למערכות
              </h4>

              {isPlannedOverCapacity && (
                <p className="modal-warning-text">
                  חריגה: סך ההקצאות המתוכננות
                  גבוה מהקיבולת השנתית.
                </p>
              )}

              <div className="allocation-preview-grid">
                {employee.allocations.map(
                  (allocation) => (
                    <label
                      key={`${allocation.systemId}-${allocation.roleInSystem}`}
                    >
                      {allocation.systemName}

                      <input
                        type="number"
                        value={
                          allocation.plannedMonths
                        }
                        readOnly
                      />
                    </label>
                  )
                )}

                {employee.allocations.length ===
                  0 && (
                  <p className="modal-section-subtitle">
                    אין הקצאות פעילות לעובד.
                  </p>
                )}
              </div>
            </section>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              {saving
                ? "שומר..."
                : mode === "edit"
                  ? "שמירה"
                  : "יצירת עובד"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}