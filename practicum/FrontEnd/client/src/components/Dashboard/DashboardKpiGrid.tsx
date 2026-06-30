import { useEffect, useState } from "react";
import { systemService } from "../../services/systemService";
import type { System } from "../../types";
import DashboardKpiCard from "./DashboardKpiCard";
import "./DashboardKpiGrid.css";

function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default function DashboardKpiGrid() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  if (loading) {
    return (
      <section className="dashboard-kpi-grid">
        <DashboardKpiCard
          title="טוען..."
          value="..."
          description="מחשב נתוני דשבורד"
        />
      </section>
    );
  }

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
      />

      <DashboardKpiCard
        title="ניצול קיבולת"
        value={toPercent(capacityUsagePercent)}
        description={`${totalAllocatedCapacity} מתוך ${totalRequiredCapacity}`}
      />

      <DashboardKpiCard
        title="פער קיבולת כולל"
        value={String(totalCapacityGap)}
        description="חודשי עבודה חסרים"
        variant={totalCapacityGap > 0 ? "red" : "default"}
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