import { useEffect, useState } from "react";

interface ProfessionalCategoryFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialName?: string;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function ProfessionalCategoryFormModal({
  open,
  mode,
  initialName = "",
  saving,
  error,
  onClose,
  onSubmit
}: ProfessionalCategoryFormModalProps) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setTouched(false);
    }
  }, [initialName, open]);

  if (!open) {
    return null;
  }

  const normalizedName = name.trim();
  const nameError = touched && !normalizedName ? "יש להזין שם קטגוריה" : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    if (!normalizedName) {
      return;
    }

    await onSubmit(normalizedName);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>{mode === "create" ? "הוספת קטגוריה מקצועית" : "עריכת קטגוריה מקצועית"}</h3>
          <p>שם קצר וחד־משמעי לקטגוריה המקצועית</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="form-grid">
            <span>שם הקטגוריה</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
          </label>

          {nameError ? <p className="modal-warning-text">{nameError}</p> : null}
          {error ? <p className="modal-warning-text">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving || !normalizedName}>
              {saving ? "שומר..." : mode === "create" ? "הוספה" : "שמירה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
