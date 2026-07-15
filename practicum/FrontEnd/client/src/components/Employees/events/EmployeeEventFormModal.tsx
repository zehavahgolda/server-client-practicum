import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { employeeEventTypeOptions } from "../../../constants/employeeEventTypes";
import type { EmployeeEvent, EmployeeEventCreatePayload } from "../../../types";
import "./EmployeeEventFormModal.css";

type EmployeeEventFormErrors = {
  eventType?: string;
  customEventType?: string;
  startDate?: string;
  endDate?: string;
};

type EmployeeEventFormState = {
  eventType: string;
  customEventType: string;
  description: string;
  startDate: string;
  endDate: string;
  openEnded: boolean;
};

const EMPTY_FORM: EmployeeEventFormState = {
  eventType: "",
  customEventType: "",
  description: "",
  startDate: "",
  endDate: "",
  openEnded: false
};

function buildInitialForm(event?: EmployeeEvent | null): EmployeeEventFormState {
  if (!event) {
    return EMPTY_FORM;
  }

  return {
    eventType: event.eventType ?? "",
    customEventType: event.customEventType ?? "",
    description: event.description ?? "",
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    openEnded: !event.endDate
  };
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));

  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function validateForm(form: EmployeeEventFormState): EmployeeEventFormErrors {
  const errors: EmployeeEventFormErrors = {};
  const eventType = form.eventType.trim();
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();

  if (!eventType) {
    errors.eventType = "יש לבחור סוג אירוע.";
  }

  if (eventType === "Other" && !form.customEventType.trim()) {
    errors.customEventType = "יש להזין סוג אירוע מותאם כאשר נבחר \"אחר\".";
  }

  if (!startDate) {
    errors.startDate = "יש להזין תאריך התחלה.";
  } else if (!isValidDateInput(startDate)) {
    errors.startDate = "פורמט תאריך התחלה אינו תקין.";
  }

  if (!form.openEnded && endDate) {
    if (!isValidDateInput(endDate)) {
      errors.endDate = "פורמט תאריך סיום אינו תקין.";
    } else if (startDate && endDate < startDate) {
      errors.endDate = "תאריך הסיום לא יכול להיות מוקדם מתאריך ההתחלה.";
    }
  }

  return errors;
}

interface EmployeeEventFormModalProps {
  open: boolean;
  employeeId: string;
  event?: EmployeeEvent | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: EmployeeEventCreatePayload) => Promise<void>;
}

export default function EmployeeEventFormModal({
  open,
  employeeId,
  event = null,
  saving,
  onClose,
  onSubmit
}: EmployeeEventFormModalProps) {
  const [form, setForm] = useState<EmployeeEventFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<EmployeeEventFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = useMemo(() => Boolean(event?.id), [event?.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildInitialForm(event));
    setErrors({});
    setSubmitError(null);
  }, [open, event, employeeId]);

  if (!open) {
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const normalizedEventType = form.eventType.trim();
    const customEventType =
      normalizedEventType === "Other"
        ? form.customEventType.trim() || null
        : null;

    const payload: EmployeeEventCreatePayload = {
      eventType: normalizedEventType,
      customEventType,
      description: form.description.trim() || null,
      startDate: form.startDate.trim(),
      endDate: form.openEnded ? null : form.endDate.trim() || null
    };

    setSubmitError(null);

    try {
      await onSubmit(payload);
    } catch {
      setSubmitError("שמירת האירוע נכשלה. נסה שוב.");
    }
  }

  function handleEventTypeChange(value: string) {
    setForm((prev) => ({
      ...prev,
      eventType: value,
      customEventType: value === "Other" ? prev.customEventType : ""
    }));

    setErrors((prev) => ({
      ...prev,
      eventType: undefined,
      customEventType: value === "Other" ? prev.customEventType : undefined
    }));
  }

  function handleToggleOpenEnded(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      openEnded: checked,
      endDate: checked ? "" : prev.endDate
    }));

    setErrors((prev) => ({ ...prev, endDate: undefined }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-card employee-event-modal-card"
        dir="rtl"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <button type="button" className="modal-close-btn" onClick={handleClose}>
          ×
        </button>

        <div className="modal-header">
          <h3>{isEditMode ? "עריכת אירוע עובד" : "הוספת אירוע עובד"}</h3>
          <p>
            {isEditMode
              ? "עדכן את פרטי האירוע ושמור את השינויים."
              : "הוסף אירוע חדש לצורך מעקב וניהול זמינות."}
          </p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {submitError && <div className="error-box">{submitError}</div>}

          <section className="modal-section">
            <h4 className="modal-section-title">פרטי האירוע</h4>

            <div className="form-grid employee-event-form-grid">
              <label>
                סוג אירוע
                <select
                  value={form.eventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                  disabled={saving}
                  required
                >
                  <option value="">בחר סוג אירוע</option>
                  {employeeEventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.eventType && (
                  <span className="employee-event-field-error">{errors.eventType}</span>
                )}
              </label>

              {form.eventType === "Other" && (
                <label>
                  סוג אירוע מותאם
                  <input
                    value={form.customEventType}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, customEventType: e.target.value }));
                      setErrors((prev) => ({ ...prev, customEventType: undefined }));
                    }}
                    disabled={saving}
                    required
                  />
                  {errors.customEventType && (
                    <span className="employee-event-field-error">{errors.customEventType}</span>
                  )}
                </label>
              )}

              <label className="employee-event-textarea-label">
                תיאור
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={saving}
                  placeholder="תיאור קצר (אופציונלי)"
                />
              </label>
            </div>
          </section>

          <section className="modal-section">
            <h4 className="modal-section-title">טווח תאריכים</h4>

            <div className="form-grid employee-event-form-grid employee-event-dates-grid">
              <label>
                תאריך התחלה
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, startDate: e.target.value }));
                    setErrors((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
                  }}
                  disabled={saving}
                  required
                />
                {errors.startDate && (
                  <span className="employee-event-field-error">{errors.startDate}</span>
                )}
              </label>

              <label>
                תאריך סיום
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, endDate: e.target.value }));
                    setErrors((prev) => ({ ...prev, endDate: undefined }));
                  }}
                  disabled={saving || form.openEnded}
                  min={form.startDate || undefined}
                />
                {errors.endDate && (
                  <span className="employee-event-field-error">{errors.endDate}</span>
                )}
              </label>
            </div>

            <label className="employee-event-open-ended-toggle">
              <input
                type="checkbox"
                checked={form.openEnded}
                onChange={(e) => handleToggleOpenEnded(e.target.checked)}
                disabled={saving}
              />
              ללא תאריך סיום
            </label>
          </section>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={handleClose} disabled={saving}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving || !employeeId.trim()}>
              {saving ? "שומר..." : isEditMode ? "שמירת שינויים" : "יצירת אירוע"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}