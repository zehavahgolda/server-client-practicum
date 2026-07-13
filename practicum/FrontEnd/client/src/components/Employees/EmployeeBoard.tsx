import type { EmployeeDetails, EmployeeListItem } from "../../types";
import EmployeeCard from "./cards/EmployeeCard";

// מאפייני לוח העובדים (רשימה, בחירה וטעינה).
interface EmployeeBoardProps {
  employees: EmployeeListItem[];
  selectedEmployee: EmployeeDetails | null;
  loading: boolean;
  lowCapacity: number;
  onSelectEmployee: (id: string) => void;
}

// מציג את רשימת העובדים ומסתיר את העובד שנבחר בפרופיל.
export default function EmployeeBoard({
  employees,
  selectedEmployee,
  loading,
  lowCapacity,
  onSelectEmployee
}: EmployeeBoardProps) {
  // כשהפרופיל פתוח, מציגים רק את שאר העובדים ברשימה.
  const visibleEmployees = selectedEmployee
    ? employees.filter((employee) => employee.id !== selectedEmployee.id)
    : employees;

  return (
    <section className="employees-board">
      <header className="employees-board-header">
        <div>
          <h2>כל העובדים</h2>
          <p>{visibleEmployees.length} עובדים מוצגים כעת</p>
        </div>

        <span className="employees-capacity-counter">
          {lowCapacity} בלחץ קיבולת
        </span>
      </header>

      {loading ? (
        <div className="system-note-box">טוען עובדים...</div>
      ) : (
        <div className="employees-cards-grid">
          {visibleEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              selected={false}
              onClick={() => onSelectEmployee(employee.id)}
            />
          ))}
        </div>
      )}

      {!loading && visibleEmployees.length === 0 && (
        <div className="empty-text">לא נמצאו עובדים נוספים להצגה.</div>
      )}
    </section>
  );
}