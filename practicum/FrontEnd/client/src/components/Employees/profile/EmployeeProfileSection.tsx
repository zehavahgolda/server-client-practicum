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

// מעטפת מודאל לפרופיל העובד.
export default function EmployeeProfileSection({
  employee,
  loading,
  allocationOptionsCount,
  onClose,
  onEdit,
  onAddAllocation,
  onUpdateAllocation
}: EmployeeProfileSectionProps) {
  return (
    <div
      className="modal-overlay employee-profile-modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card employee-profile-modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="סגירת פרופיל עובד"
        >
          ×
        </button>

        {loading ? (
          <section className="employees-profile-board">
            <div className="system-note-box">
              טוען פרטי עובד...
            </div>
          </section>
        ) : (
          <EmployeeProfile
            employee={employee}
            allocationOptionsCount={
              allocationOptionsCount
            }
            onClose={onClose}
            onEdit={onEdit}
            onAddAllocation={onAddAllocation}
            onUpdateAllocation={
              onUpdateAllocation
            }
          />
        )}
      </div>
    </div>
  );
}