interface ProfessionalCategoryDeactivateDialogProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ProfessionalCategoryDeactivateDialog({
  open,
  saving,
  onClose,
  onConfirm
}: ProfessionalCategoryDeactivateDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>השבתת קטגוריה מקצועית</h3>
          <p>הקטגוריה לא תופיע בבחירות חדשות, אך מידע קיים שמשתמש בה יישמר.</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>
            ביטול
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={saving}>
            {saving ? "משבית..." : "השבתה"}
          </button>
        </div>
      </div>
    </div>
  );
}
