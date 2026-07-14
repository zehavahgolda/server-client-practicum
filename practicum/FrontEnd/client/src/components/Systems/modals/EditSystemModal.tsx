import { useEffect, useState } from "react";

import { logger } from "../../../services/logging/logger";
import { systemService } from "../../../services/systemService";

import type { SystemDetails, SystemUpdateDto } from "../../../types";

import "./EditSystemModal.css";

// מאפייני מודל עריכת מערכת.
interface Props {
  open: boolean;
  system: SystemDetails | null;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

// בונה מצב טופס התחלתי לפי המערכת שנבחרה לעריכה.
function buildInitialForm(
  system: SystemDetails | null
): SystemUpdateDto {
  return {
    name: system?.name ?? "",
    requiredCapacityMonths:
      system?.requiredCapacityMonths ?? 1,
    allocatedBudget: system?.allocatedBudget ?? 0
  };
}

// מודל עריכת מערכת עם ולידציה ושמירת שינויים.
export default function EditSystemModal({
  open,
  system,
  onClose,
  onUpdated
}: Props) {
  const [form, setForm] = useState<SystemUpdateDto>(() =>
    buildInitialForm(system)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // מסנכרן את ערכי הטופס עם המערכת הפעילה בכל פתיחה.
  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(system));
      setError("");
      setSaving(false);
    }
  }, [open, system]);

  const currentSystem = open ? system : null;

  if (!currentSystem) {
    return null;
  }

  const systemId = currentSystem.id;

  // מאמת קלט ושומר עדכון מערכת בשרת.
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
      await systemService.updateSystem(systemId, {
        name,
        requiredCapacityMonths:
          form.requiredCapacityMonths,
        allocatedBudget:
          Number(form.allocatedBudget) || 0
      });

      logger.info("System updated", {
        feature: "systems",
        action: "updateSystem",
        entityId: systemId
      });

      await onUpdated();
      onClose();
    } catch (err) {
      logger.error("Failed to update system", err, {
        feature: "systems",
        action: "updateSystem",
        entityId: systemId
      });

      const message =
        err instanceof Error
          ? err.message
          : "שגיאה בעדכון מערכת.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-system-backdrop">
      <div className="edit-system-modal" dir="rtl">
        <button
          type="button"
          className="edit-system-close"
          onClick={onClose}
          disabled={saving}
        >
          ×
        </button>

        <h2>עריכת מערכת</h2>
        <p>
          מסך נוח לניהול דרישות הקיבולת והתקציב של
          מערכת.
        </p>

        {error && <div className="error-box">{error}</div>}

        <div className="form-grid edit-system-form-grid">
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

        <div className="edit-system-actions">
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
            {saving ? "שומר..." : "שמירת שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}