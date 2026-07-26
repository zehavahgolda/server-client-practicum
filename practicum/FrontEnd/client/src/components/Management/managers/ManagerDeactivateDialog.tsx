import type { ManagerListItem } from "../../../types";

interface ManagerDeactivateDialogProps {
  open: boolean;
  manager: ManagerListItem | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ManagerDeactivateDialog({
  open,
  manager,
  saving,
  onClose,
  onConfirm
}: ManagerDeactivateDialogProps) {
  if (!open || !manager) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card management-managers-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="סגירה"
        >
          ×
        </button>

        <div className="modal-header">
          <h3>השבתת מנהל</h3>
          <p>
            האם להשבית את
            <strong> {manager.fullName}</strong>?
          </p>
        </div>

        <div className="modal-actions">
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
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? "משבית..." : "השבתה"}
          </button>
        </div>
      </div>
    </div>
  );
}
