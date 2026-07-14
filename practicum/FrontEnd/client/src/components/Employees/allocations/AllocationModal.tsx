import { useState } from "react";
import type { FormEvent } from "react";
import type { System } from "../../../types";
import { isValidHalfMonthValue, MAX_MONTHS, normalizeMonthValue } from "../../../utils/months";
// מגביל קלט חודשי עבודה לטווח תקין 0-12.
function clampMonthsInput(value: string): string {
  if (value === "") return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "";

  return String(normalizeMonthValue(numericValue, { min: 0, max: MAX_MONTHS }));
}

// מאפייני מודל הוספת הקצאה לעובד.
interface AllocationModalProps {
  open: boolean;
  systems: System[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    systemId: string;
    roleInSystem: string;
    plannedMonths: number;
    actualMonths: number;
  }) => Promise<void>;
}

// מודל ליצירת הקצאה חדשה עם ולידציה בסיסית ושמירה.
export default function AllocationModal({
  open,
  systems,
  saving,
  onClose,
  onSubmit
}: AllocationModalProps) {
  const [form, setForm] = useState({
    systemId: "",
    roleInSystem: "",
    plannedMonths: "",
    actualMonths: "0"
  });

  if (!open) return null;

  // מאמת את הטופס ושולח payload מסודר להוספת ההקצאה.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.systemId || !form.roleInSystem.trim()) return;

    const plannedMonths = Number(form.plannedMonths);
    const actualMonths = Number(form.actualMonths);

    if (
      Number.isNaN(plannedMonths) ||
      Number.isNaN(actualMonths) ||
      !isValidHalfMonthValue(plannedMonths, { min: 0, max: MAX_MONTHS }) ||
      !isValidHalfMonthValue(actualMonths, { min: 0, max: MAX_MONTHS })
    ) {
      return;
    }

    await onSubmit({
      systemId: form.systemId,
      roleInSystem: form.roleInSystem.trim(),
      plannedMonths,
      actualMonths
    });

    setForm({
      systemId: "",
      roleInSystem: "",
      plannedMonths: "",
      actualMonths: "0"
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <h3>הוספת הקצאה חדשה</h3>
          <p>הקצה עובד למערכת עם תפקיד וחודשים מתוכננים.</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              מערכת
              <select
                value={form.systemId}
                onChange={(e) => setForm((p) => ({ ...p, systemId: e.target.value }))}
                required
              >
                <option value="">בחר מערכת</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              תפקיד במערכת
              <input
                value={form.roleInSystem}
                onChange={(e) => setForm((p) => ({ ...p, roleInSystem: e.target.value }))}
                placeholder="למשל: Backend"
                required
              />
            </label>

            <label>
              חודשים מתוכננים
              <input
                type="number"
                min={0}
                max={MAX_MONTHS}
                step={0.5}
                value={form.plannedMonths}
                onChange={(e) => setForm((p) => ({ ...p, plannedMonths: clampMonthsInput(e.target.value) }))}
                required
              />
            </label>

            <label>
              חודשים בפועל
              <input
                type="number"
                min={0}
                max={MAX_MONTHS}
                step={0.5}
                value={form.actualMonths}
                onChange={(e) => setForm((p) => ({ ...p, actualMonths: clampMonthsInput(e.target.value) }))}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "שומר..." : "הוספת הקצאה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}