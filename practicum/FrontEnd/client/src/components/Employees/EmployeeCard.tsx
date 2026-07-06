import type { EmployeeListItem } from "../../types";
import "./EmployeeCard.css";
import "./EmployeeFilters.css";

// מאפייני כרטיס עובד בודד.
interface EmployeeCardProps {
  employee: EmployeeListItem;
  selected?: boolean;
  onClick: () => void;
}

// קובע טון תצוגה לפי יתרת חודשי הקיבולת.
function getTone(employee: EmployeeListItem) {
  if (employee.remainingMonths < 0) return "overloaded";
  if (employee.remainingMonths === 0) return "balanced";
  return "available";
}

// מחזיר תווית סטטוס קריאה למשתמש.
function getStatusLabel(employee: EmployeeListItem) {
  if (employee.remainingMonths < 0) return "עומס יתר";
  if (employee.remainingMonths === 0) return "מלא";
  return "זמין";
}

// מציג כרטיס עובד עם נתוני קיבולת, סטטוס ופרטים תפעוליים.
export default function EmployeeCard({
  employee,
  selected = false,
  onClick
}: EmployeeCardProps) {
  const tone = getTone(employee);

  return (
    <button
      type="button"
      className={`employee-card ${tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="employee-card-top">

        <div className="employee-card-title">

          <strong>{employee.fullName}</strong>

          <span>
            {employee.professionalSubCategory ??
              employee.professionalCategory}
          </span>

          <small>מנהל: {employee.managerName}</small>

        </div>

        <span className={`employee-status-pill ${tone}`}>
          {getStatusLabel(employee)}
        </span>

      </div>

      <div className="employee-card-divider" />

      <div className="employee-card-metrics">

        <div>
          <span>קיבולת</span>
          <strong>{employee.yearlyCapacityMonths}</strong>
        </div>

        <div>
          <span>מוקצה</span>
          <strong>{employee.allocatedMonths}</strong>
        </div>

        <div>
          <span>יתרה</span>
          <strong className={tone}>
            {employee.remainingMonths}
          </strong>
        </div>

        <div>
          <span>מערכות</span>
          <strong>{employee.assignedSystemsCount}</strong>
        </div>

      </div>

    </button>
  );
}