import type { EmployeeAllocation } from "../../../types";
// ממפה סטטוס קיבולת למחלקת CSS בטוחה ומוכרת מראש.
function getStatusClass(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "balanced" || normalized === "מאוזן") return "balanced";
  if (normalized === "shortage" || normalized === "under capacity" || normalized === "בחוסר" || normalized === "במחסור" || normalized === "חוסר") return "shortage";
  if (normalized === "excess" || normalized === "over capacity" || normalized === "בעודף" || normalized === "עודף") return "excess";

  return "unknown";
}

// מאפייני פריט הקצאה בודד להצגה בכרטיס.
interface Props {
  allocation: EmployeeAllocation;
}

// מציג שורת הקצאה עם מערכת, תפקיד, חודשים וסטטוס קיבולת.
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
          className={`allocation-status ${getStatusClass(allocation.systemCapacityStatus)}`}
        >
          {allocation.systemCapacityStatus}
        </div>

      </div>

    </article>
  );
}