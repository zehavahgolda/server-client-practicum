
import type { EmployeeDetails } from "../../../types";
import EmployeeProfile from "./EmployeeProfile";

// מאפייני מעטפת פרופיל עובד עם פעולות ניהול.
interface EmployeeProfileSectionProps {
  employee: EmployeeDetails;
  loading: boolean;
  allocationOptionsCount: number;
  onClose: () => void;
  onEdit: () => void;
  onAddAllocation: () => void;
  onUpdateAllocation: () => void;
}

// מעטפת פרופיל העובד: Toolbar פעולות + תצוגת פרטים מלאה.
export default function EmployeeProfileSection({
  employee,
  loading,
  allocationOptionsCount,
  onClose,
  onEdit,
  onAddAllocation,
  onUpdateAllocation
}: EmployeeProfileSectionProps) {
  if (loading) {
    return (
      <div className="modal-overlay employee-profile-modal-overlay" onClick={onClose}>
        <div
          className="modal-card employee-profile-modal-card"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>

          <section className="employees-profile-board">
            <div className="system-note-box">טוען פרטי עובד...</div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay employee-profile-modal-overlay" onClick={onClose}>
      <div
        className="modal-card employee-profile-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <section className="employees-profile-board">
          <div className="employees-profile-toolbar">
            <button
              type="button"
              className="secondary-btn employees-back-btn"
              onClick={onClose}
            >
              סגירת פרופיל
            </button>

            <div className="detail-actions employees-profile-actions">
              <button type="button" className="secondary-btn" onClick={onEdit}>
                עריכת עובד
              </button>

              <button type="button" className="secondary-btn" onClick={onAddAllocation}>
                + הוספת הקצאה
              </button>

              {allocationOptionsCount > 0 && (
                <button type="button" className="secondary-btn" onClick={onUpdateAllocation}>
                  ✎ עדכון חודשים
                </button>
              )}
            </div>
          </div>

          <EmployeeProfile employee={employee} />
        </section>
      </div>
    </div>
  );
}