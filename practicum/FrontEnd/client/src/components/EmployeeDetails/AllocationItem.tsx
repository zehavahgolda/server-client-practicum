import { type EmployeeAllocation } from "../../types/employee";
interface Props {
  allocation: EmployeeAllocation;
}

export function AllocationItem({ allocation }: Props) {
  return (
    <div className="allocation-row">
      <div className="system-info">
        <strong>{allocation.systemName}</strong>
        <p>{allocation.roleInSystem} | מתוכנן: {allocation.plannedMonths} חודשים</p>
      </div>
      <div className="status-badge">
        {allocation.systemCapacityStatus}
      </div>
    </div>
  );
}