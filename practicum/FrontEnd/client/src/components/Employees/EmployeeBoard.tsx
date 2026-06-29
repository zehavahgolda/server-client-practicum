// import type { EmployeeDetails, EmployeeListItem } from "../../types";
// import EmployeeCard from "./EmployeeCard";

// interface EmployeeBoardProps {
//   employees: EmployeeListItem[];
//   selectedEmployee: EmployeeDetails | null;
//   loading: boolean;
//   lowCapacity: number;
//   onSelectEmployee: (id: string) => void;
// }

// export default function EmployeeBoard({
//   employees,
//   selectedEmployee,
//   loading,
//   lowCapacity,
//   onSelectEmployee
// }: EmployeeBoardProps) {
//   return (
//     <section className="employees-board">
//       <header className="employees-board-header">
//         <div>
//           <h2>כל העובדים</h2>
//           <p>{employees.length} עובדים מוצגים כעת</p>
//         </div>

//         <span className="employees-capacity-counter">
//           {lowCapacity} בלחץ קיבולת
//         </span>
//       </header>

//       {loading ? (
//         <div className="system-note-box">טוען עובדים...</div>
//       ) : (
//         <div className="employees-cards-grid">
//           {employees.map((employee) => (
//             <EmployeeCard
//               key={employee.id}
//               employee={employee}
//               selected={selectedEmployee?.id === employee.id}
//               onClick={() => onSelectEmployee(employee.id)}
//             />
//           ))}
//         </div>
//       )}

//       {!loading && employees.length === 0 && (
//         <div className="empty-text">לא נמצאו עובדים להצגה.</div>
//       )}
//     </section>
//   );
// }
import type { EmployeeDetails, EmployeeListItem } from "../../types";
import EmployeeCard from "./EmployeeCard";

interface EmployeeBoardProps {
  employees: EmployeeListItem[];
  selectedEmployee: EmployeeDetails | null;
  loading: boolean;
  lowCapacity: number;
  onSelectEmployee: (id: string) => void;
}

export default function EmployeeBoard({
  employees,
  selectedEmployee,
  loading,
  lowCapacity,
  onSelectEmployee
}: EmployeeBoardProps) {
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