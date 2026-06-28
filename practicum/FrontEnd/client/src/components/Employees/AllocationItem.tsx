import type { EmployeeAllocation } from "../../types";

interface Props {
  allocation: EmployeeAllocation;
}

export default function AllocationItem({ allocation }: Props) {
  return (
    <article className="allocation-item">

      <div className="allocation-main">

        <div className="allocation-title">
          {allocation.systemName}
        </div>

        <div className="allocation-subtitle">
          {allocation.roleInSystem}
        </div>

      </div>

      <div className="allocation-side">

        <div className="allocation-months">
          {allocation.actualMonths} / {allocation.plannedMonths}
        </div>

        <div
          className={`allocation-status ${allocation.systemCapacityStatus.toLowerCase()}`}
        >
          {allocation.systemCapacityStatus}
        </div>

      </div>

    </article>
  );
}