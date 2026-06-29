
import type { EmployeeDetails } from "../../types";
import EmployeeProfile from "./EmployeeProfile";

interface EmployeeProfileSectionProps {
  employee: EmployeeDetails;
  loading: boolean;
  allocationOptionsCount: number;
  onClose: () => void;
  onEdit: () => void;
  onAddAllocation: () => void;
  onUpdateAllocation: () => void;
}

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
      <section className="employees-profile-board">
        <div className="system-note-box">טוען פרטי עובד...</div>
      </section>
    );
  }

  return (
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
  );
}