
import { useState } from "react";
import type { FormEvent } from "react";
import { isValidHalfMonthValue, MAX_MONTHS, normalizeMonthValue } from "../../../utils/months";
function clampMonthsInput(value: string): string {
  if (value === "") return "";

  // המרה מנורמלת: החלפת פסיק בנקודה לטיפול בהגדרות שפה של דפדפנים
  const normalizedValue = value.replace(',', '.');
  const numericValue = Number(normalizedValue);
  
  if (Number.isNaN(numericValue)) return "";

  // החזרת הערך הנורמלי כסטרינג עם נקודה
  const clamped = normalizeMonthValue(numericValue, { min: 0, max: MAX_MONTHS });
  return String(clamped);
}

export interface AllocationOption {
  key: string;
  systemId: string;
  roleInSystem: string;
  label: string;
}

interface AllocationUpdateModalProps {
  open: boolean;
  options: AllocationOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (systemId: string, roleInSystem: string, actualMonths: number) => Promise<void>;
}

export default function AllocationUpdateModal({
  open,
  options,
  saving,
  onClose,
  onSubmit
}: AllocationUpdateModalProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [actualMonths, setActualMonths] = useState("");

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selected = options.find((option) => option.key === selectedKey);
    if (!selected) return;

    // שימוש ב-parseFloat כדי להבטיח קריאה של הנקודה העשרונית
    const numericMonths = parseFloat(actualMonths.replace(',', '.'));
    
    if (!isValidHalfMonthValue(numericMonths, { min: 0, max: MAX_MONTHS })) return;

    // שליחת ה-ID התקין שנלקח מהאופציה הנבחרת
    await onSubmit(selected.systemId, selected.roleInSystem, numericMonths);

    setSelectedKey("");
    setActualMonths("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <h3>עדכון חודשי הקצאה בפועל</h3>
          <p>בחר הקצאה קיימת ועדכן את מספר החודשים בפועל.</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              מערכת ותפקיד
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                disabled={options.length === 0}
                required
              >
                <option value="">בחר הקצאה קיימת</option>
                {options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              חודשים בפועל
              <input
                type="number"
                step={0.5}
                min={0}
                max={MAX_MONTHS}
                value={actualMonths}
                onChange={(e) => setActualMonths(clampMonthsInput(e.target.value))}
                required
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "שומר..." : "שמירת עדכון"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}