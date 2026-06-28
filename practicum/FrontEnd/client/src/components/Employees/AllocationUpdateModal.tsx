import { useState } from "react";
import type { FormEvent } from "react";

const MAX_MONTHS = 12;

function clampMonthsInput(value: string): string {
  if (value === "") return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "";
  if (numericValue < 0) return "0";
  if (numericValue > MAX_MONTHS) return String(MAX_MONTHS);

  return value;
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

    const numericMonths = Number(actualMonths);
    if (Number.isNaN(numericMonths) || numericMonths < 0 || numericMonths > MAX_MONTHS) return;

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