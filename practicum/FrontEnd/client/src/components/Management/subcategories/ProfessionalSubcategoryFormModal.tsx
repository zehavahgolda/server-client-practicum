import { useEffect, useMemo, useState } from "react";

import type { CategoryDto } from "../../../types";

interface ProfessionalSubcategoryFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  categories: CategoryDto[];
  initialName?: string;
  initialParentCategoryId?: string;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; parentCategoryId: string }) => Promise<void>;
}

export default function ProfessionalSubcategoryFormModal({
  open,
  mode,
  categories,
  initialName = "",
  initialParentCategoryId = "",
  saving,
  error,
  onClose,
  onSubmit
}: ProfessionalSubcategoryFormModalProps) {
  const [name, setName] = useState(initialName);
  const [parentCategoryId, setParentCategoryId] = useState(initialParentCategoryId);
  const [touched, setTouched] = useState(false);

  const defaultParentId = useMemo(() => {
    if (initialParentCategoryId) {
      return initialParentCategoryId;
    }

    return categories[0]?.id ?? "";
  }, [categories, initialParentCategoryId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialName);
    setParentCategoryId(defaultParentId);
    setTouched(false);
  }, [defaultParentId, initialName, open]);

  if (!open) {
    return null;
  }

  const normalizedName = name.trim();
  const nameError = touched && !normalizedName ? "יש להזין שם תת־קטגוריה" : null;
  const parentError = touched && !parentCategoryId ? "יש לבחור קטגוריה מקצועית" : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    if (!normalizedName || !parentCategoryId) {
      return;
    }

    await onSubmit({
      name: normalizedName,
      parentCategoryId
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card management-dialog-subcategory" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>{mode === "create" ? "הוספת תת־קטגוריה" : "עריכת תת־קטגוריה"}</h3>
          <p>ניהול התמחויות ותפקידים תחת קטגוריות מקצועיות</p>
        </div>

        <form className="modal-form management-form-subcategory" onSubmit={handleSubmit} noValidate>
          <label className="management-form-subcategory-field">
            <span>קטגוריה מקצועית</span>
            <select
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
              onBlur={() => setTouched(true)}
              disabled={saving || categories.length === 0}
            >
              <option value="">בחירת קטגוריה מקצועית</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="management-form-subcategory-field">
            <span>שם תת־קטגוריה</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
          </label>

          {parentError ? <p className="modal-warning-text">{parentError}</p> : null}
          {nameError ? <p className="modal-warning-text">{nameError}</p> : null}
          {error ? <p className="modal-warning-text">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving || !normalizedName || !parentCategoryId}>
              {saving ? "שומר..." : "שמירה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
