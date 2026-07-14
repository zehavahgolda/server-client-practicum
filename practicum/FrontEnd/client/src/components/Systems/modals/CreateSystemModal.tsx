import { useEffect, useState } from "react";

import { logger } from "../../../services/logging/logger";
import { systemService } from "../../../services/systemService";

import type { SystemCreateDto } from "../../../types";

import { getActiveYear } from "../../../utils/yearOptions";

import "./CreateSystemModal.css";

// מאפייני מודל יצירת מערכת חדשה.
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

// בונה את ערכי ברירת המחדל לטופס יצירת מערכת.
function buildInitialForm(): SystemCreateDto {
  return {
    name: "",
    year: getActiveYear(),
    requiredCapacityMonths: 12,
    allocatedBudget: 0,
    managementNote: ""
  };
}

// מודל יצירת מערכת כולל ולידציה בסיסית ושמירה לשרת.
export default function CreateSystemModal({
  open,
  onClose,
  onCreated
}: Props) {
  const [form, setForm] = useState<SystemCreateDto>(
    buildInitialForm
  );

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

  if (!open) {
    return null;
  }

  // מאמת שדות ושומר מערכת חדשה בשרת.
  async function save() {
    const name = form.name.trim();

    if (!name) {
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
        name,
        allocatedBudget:
          Number(form.allocatedBudget) || 0,
        managementNote:
          form.managementNote?.trim() || undefined
      });

      logger.info("System created", {
        feature: "systems",
        action: "createSystem",
        year: form.year
      });

      await onCreated();
      onClose();
    } catch (err) {
      logger.error("Failed to create system", err, {
        feature: "systems",
        action: "createSystem",
        year: form.year
      });

      const message =
        err instanceof Error
          ? err.message
          : "שגיאה בהוספת מערכת.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-system-backdrop">
      <div className="create-system-modal" dir="rtl">
        <button
          type="button"
          className="create-system-close"
          onClick={onClose}
          disabled={saving}
        >
          ×
        </button>

        <h2>הוספת מערכת</h2>
        <p>
          מסך זריז לניהול דרישות הקיבולת והתקציב של
          מערכת.
        </p>

        {error && <div className="error-box">{error}</div>}

        <div className="form-grid">
          <label>
            שם מערכת *
            <input
              value={form.name}
              onChange={(event) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  name: event.target.value
                }))
              }
              disabled={saving}
            />
          </label>

          <label>
            שנה
            <input
              type="number"
              value={form.year}
              onChange={(event) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  year: Number(event.target.value)
                }))
              }
              disabled={saving}
            />
          </label>

          <label>
            חודשי עבודה נדרשים *
            <input
              type="number"
              min={1}
              value={form.requiredCapacityMonths}
              onChange={(event) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  requiredCapacityMonths: Number(
                    event.target.value
                  )
                }))
              }
              disabled={saving}
            />
          </label>

          <label>
            תקציב מוקצה
            <input
              type="number"
              min={0}
              value={form.allocatedBudget}
              onChange={(event) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  allocatedBudget: Number(
                    event.target.value
                  )
                }))
              }
              disabled={saving}
            />
          </label>
        </div>

        <label className="create-system-note-label">
          הערת ניהול
          <textarea
            value={form.managementNote ?? ""}
            onChange={(event) =>
              setForm((previousForm) => ({
                ...previousForm,
                managementNote: event.target.value
              }))
            }
            disabled={saving}
          />
        </label>

        <div className="create-system-actions">
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
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "שומר..." : "שמירה"}
          </button>
        </div>
      </div>
    </div>
  );
}