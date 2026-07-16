interface OrganizationEventDeactivateDialogProps {
  open: boolean;
  saving: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function OrganizationEventDeactivateDialog({
  open,
  saving,
  title,
  onClose,
  onConfirm
}: OrganizationEventDeactivateDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card management-org-event-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>השבתת אירוע כלל־ארגוני</h3>
          <p>
            האם להשבית את האירוע
            <strong> {title}</strong>?
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