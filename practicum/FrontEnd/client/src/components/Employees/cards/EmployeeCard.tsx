import type { EmployeeListItem } from "../../../types";
import "./EmployeeCard.css";

// מאפייני כרטיס עובד בודד.
interface EmployeeCardProps {
  employee: EmployeeListItem;
  selected?: boolean;
  onClick: () => void;
}

type EmployeeBudgetIndicators = {
  budgetStatus?: string;
  remainingBudget?: number;
};

// בודק האם מצב התקציב של העובד נחשב ירוק.
function isBudgetGreen(employee: EmployeeListItem): boolean {
  const withBudget = employee as EmployeeListItem & EmployeeBudgetIndicators;

  if (typeof withBudget.remainingBudget === "number") {
    return withBudget.remainingBudget > 0;
  }

  if (typeof withBudget.budgetStatus === "string") {
    const normalized = withBudget.budgetStatus.trim().toLowerCase();

    return (
      normalized === "balanced" ||
      normalized === "within budget" ||
      normalized === "green"
    );
  }

  return false;
}

// קובע טון תצוגה לפי יתרת חודשי הקיבולת.
function getTone(employee: EmployeeListItem) {
  const monthsGreen = employee.remainingMonths > 0;
  const budgetGreen = isBudgetGreen(employee);

  if (monthsGreen && budgetGreen) return "available";
  if (employee.remainingMonths < 0) return "overloaded";

  return "balanced";
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
      </div>

      <div className="employee-card-divider" />

      <div className="employee-card-metrics">
        <div>
          <span>מכסה שנתית</span>
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