import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { systemService } from "../../services/systemService";
import type { System } from "../../types";
import DashboardKpiCard from "./DashboardKpiCard";
import "./DashboardKpiGrid.css";

// ממיר ערך מספרי לאחוז מעוגל לתצוגה בכרטיסי KPI.
function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

// מעצב ערך כספי לפי פורמט מטבע ישראלי להצגה אחידה.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

// גריד KPI מרכזי בדשבורד שמחשב ומציג מדדים מתוך נתוני המערכות.
export default function DashboardKpiGrid() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // טוען את רשימת המערכות ליצירת מדדי KPI ומונע עדכון סטייט אחרי unmount.
    async function loadSystems() {
      try {
        const data = await systemService.getSystems();

        if (isMounted) {
          setSystems(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard KPI systems", error);

        if (isMounted) {
          setSystems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSystems();

    return () => {
      isMounted = false;
    };
  }, []);

  // תצוגת ביניים בזמן טעינת נתוני הדשבורד.
  if (loading) {
    return (
      <section className="dashboard-kpi-grid">
        <DashboardKpiCard
          title="טוען..."
          value="..."
          description="מחשב נתוני דשבורד"
          onClick={() => navigate("/systems")}
        />
      </section>
    );
  }

  // חישוב מדדי תקציב כוללים עבור כלל המערכות.
  const totalAllocatedBudget = systems.reduce(
    (sum, system) => sum + (system.allocatedBudget || 0),
    0
  );

  const totalUsedBudget = systems.reduce(
    (sum, system) => sum + (system.usedBudget || 0),
    0
  );

  const budgetUsagePercent =
    totalAllocatedBudget > 0 ? (totalUsedBudget / totalAllocatedBudget) * 100 : 0;

  // חישוב מדדי קיבולת לצורך כרטיסי KPI תפעוליים.
  const totalRequiredCapacity = systems.reduce(
    (sum, system) => sum + (system.requiredCapacityMonths || 0),
    0
  );

  const totalAllocatedCapacity = systems.reduce(
    (sum, system) => sum + (system.allocatedMonths || 0),
    0
  );

  const capacityUsagePercent =
    totalRequiredCapacity > 0
      ? (totalAllocatedCapacity / totalRequiredCapacity) * 100
      : 0;

  // מדדי מצב מערכתיים: חוסר/איזון/חריגות תקציב.
  const totalCapacityGap = systems.reduce(
    (sum, system) => sum + Math.max(system.gap || 0, 0),
    0
  );

  const balancedOrExcessCount = systems.filter((system) => system.gap <= 0).length;
  const shortageCount = systems.filter((system) => system.gap > 0).length;
  const budgetOverrunCount = systems.filter((system) => system.budgetGap < 0).length;

  return (
    <section className="dashboard-kpi-grid">
      <DashboardKpiCard
        title="ניצול תקציב"
        value={toPercent(budgetUsagePercent)}
        description={`${formatCurrency(totalUsedBudget)} מתוך ${formatCurrency(totalAllocatedBudget)}`}
        variant={budgetOverrunCount > 0 ? "red" : "orange"}
      />

      <DashboardKpiCard
        title="מצב כללי"
        value={toPercent(
          systems.length > 0 ? (balancedOrExcessCount / systems.length) * 100 : 0
        )}
        description={`${balancedOrExcessCount} מאוזנות/עודף מתוך ${systems.length}`}
        variant="blue"
        onClick={() => navigate("/systems?view=status")}
      />

      <DashboardKpiCard
        title="ניצול קיבולת"
        value={toPercent(capacityUsagePercent)}
        description={`${totalAllocatedCapacity} מתוך ${totalRequiredCapacity}`}
        onClick={() => navigate("/employees?availability=low")}
      />

      <DashboardKpiCard
        title="פער קיבולת כולל"
        value={String(totalCapacityGap)}
        description="חודשי עבודה חסרים"
        variant={totalCapacityGap > 0 ? "red" : "default"}
        onClick={() => navigate("/employees?availability=overloaded")}
      />

      <DashboardKpiCard
        title="מערכות בחריגת תקציב"
        value={String(budgetOverrunCount)}
        description={
          budgetOverrunCount > 0
            ? "יש מערכות שחרגו מהתקציב"
            : `אין חריגות תקציב · ${shortageCount} מערכות בחוסר קיבולת`
        }
        variant={budgetOverrunCount > 0 ? "red" : "default"}
      />
    </section>
  );
}