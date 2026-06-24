// שנה את השורה הזו:
import { type EmployeeDetails as IEmployeeDetails } from "../../types";
import { AllocationItem } from "./AllocationItem";

interface Props {
  employee: IEmployeeDetails;
}

export function EmployeeDetails({ employee }: Props) {
  return (
    <div className="employee-card">
      <header>
        <h2>{employee.fullName}</h2>
        <p>{employee.professionalCategory} | מנהל: {employee.managerName}</p>
      </header>

      {/* אזור המדדים */}
      <section className="metrics-grid">
        <div className="metric"><span>קיבולת</span><strong>{employee.yearlyCapacityMonths}</strong></div>
        <div className="metric"><span>יתרה</span><strong>{employee.remainingMonths}</strong></div>
      </section>

      {/* רשימת המערכות */}
      <h4>שיבוצים פעילים</h4>
      <div className="allocations-list">
        {employee.allocations.map((a) => (
          <AllocationItem key={a.systemId} allocation={a} />
        ))}
      </div>
    </div>
  );
}3