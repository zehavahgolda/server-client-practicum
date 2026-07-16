interface ProfessionalSubcategoryDeactivateDialogProps {
  open: boolean;
  saving: boolean;
  subcategoryName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ProfessionalSubcategoryDeactivateDialog({
  open,
  saving,
  subcategoryName,
  onClose,
  onConfirm
}: ProfessionalSubcategoryDeactivateDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card management-dialog-subcategory" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>השבתת תת־קטגוריה מקצועית</h3>
          <p>
            האם להשבית את תת־הקטגוריה
            <strong> {subcategoryName}</strong>?
          </p>
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
