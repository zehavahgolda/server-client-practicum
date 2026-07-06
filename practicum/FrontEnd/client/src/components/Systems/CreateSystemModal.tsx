import { useEffect, useState } from "react";
import { systemService } from "../../services/systemService";
import type { SystemCreateDto } from "../../types";
import "./CreateSystemModal.css";

// מאפייני מודל יצירת מערכת חדשה.
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

// מחזיר את שנת העבודה הנוכחית כברירת מחדל.
function getDefaultYear() {
  return new Date().getFullYear();
}

// בונה את ערכי ברירת המחדל לטופס יצירת מערכת.
function buildInitialForm(): SystemCreateDto {
  return {
    name: "",
    year: getDefaultYear(),
    requiredCapacityMonths: 12,
    allocatedBudget: 0,
    managementNote: ""
  };
}

// מודל יצירת מערכת כולל ולידציה בסיסית ושמירה לשרת.
export default function CreateSystemModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<SystemCreateDto>(() => buildInitialForm());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // מאפס את הטופס בכל פתיחה חדשה של המודל.
  useEffect(() => {
    if (open) {
      setForm(buildInitialForm());
      setError("");
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  // מאמת שדות ושומר מערכת חדשה בשרת.
  async function save() {
    if (!form.name.trim()) {
      setError("חובה להזין שם מערכת.");
      return;
    }

    if (form.requiredCapacityMonths <= 0) {
      setError("חודשי עבודה נדרשים חייבים להיות מעל 0.");
      return;
    }

    if (form.allocatedBudget < 0) {
      setError("תקציב מוקצה לא יכול להיות שלילי.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await systemService.createSystem({
        ...form,
        name: form.name.trim(),
        allocatedBudget: Number(form.allocatedBudget) || 0,
        managementNote: form.managementNote?.trim() || undefined
      });

      await onCreated();
      onClose();
    } catch {
      setError("שגיאה בהוספת מערכת.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-system-backdrop">
      <div className="create-system-modal" dir="rtl">
        <button type="button" className="create-system-close" onClick={onClose}>
          ×
        </button>

        <h2>הוספת מערכת</h2>
        <p>מסך זריז לניהול דרישות הקיבולת והתקציב של מערכת.</p>

        {error && <div className="error-box">{error}</div>}

        <div className="form-grid">
          <label>
            שם מערכת *
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </label>

          <label>
            שנה
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
            />
          </label>

          <label>
            חודשי עבודה נדרשים *
            <input
              type="number"
              min={1}
              value={form.requiredCapacityMonths}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  requiredCapacityMonths: Number(e.target.value)
                }))
              }
            />
          </label>

          <label>
            תקציב מוקצה
            <input
              type="number"
              min={0}
              value={form.allocatedBudget}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  allocatedBudget: Number(e.target.value)
                }))
              }
            />
          </label>
        </div>

        <label className="create-system-note-label">
          הערת ניהול
          <textarea
            value={form.managementNote}
            onChange={(e) =>
              setForm((p) => ({ ...p, managementNote: e.target.value }))
            }
          />
        </label>

        <div className="create-system-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            ביטול
          </button>

          <button type="button" className="primary-btn" onClick={save} disabled={saving}>
            {saving ? "שומר..." : "שמירה"}
          </button>
        </div>
      </div>
    </div>
  );
}