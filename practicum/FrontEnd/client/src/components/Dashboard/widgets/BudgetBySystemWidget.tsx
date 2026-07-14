import { useEffect, useState } from "react";

import DashboardChartCard from "../charts/DashboardChartCard";
import DashboardHorizontalBars from "../charts/DashboardHorizontalBars";

import { logger } from "../../../services/logging/logger";
import { systemService } from "../../../services/systemService";

// פלטת צבעים קבועה להצגת עמודות באופן מובחן ועקבי.
const chartColors = [
  "#1f6db3",
  "#149584",
  "#7550b9",
  "#6c7d13",
  "#cb6a0b",
  "#b43135",
  "#4f8f5b"
];

// מודל נתון לגרף: תווית מערכת, ערך תקציב וצבע תצוגה.
interface BudgetBarItem {
  label: string;
  value: number;
  color: string;
}

// קומפוננטת ווידג'ט המציגה חלוקת תקציב לפי מערכות בגרף עמודות אופקי.
export default function BudgetBySystemWidget() {
  const [budgetBySystem, setBudgetBySystem] = useState<BudgetBarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // טוענת מערכות מהשרת, ממפה לערכי תקציב, מסננת/ממיינת ומוסיפה צבע לכל שורה.
    async function loadBudgetBySystem() {
      try {
        const systems = await systemService.getSystems();

        const items = systems
          .map((system) => ({
            label: system.name,
            value: system.allocatedBudget || 0
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((item, index) => ({
            ...item,
            color: chartColors[index % chartColors.length]
          }));

        if (isMounted) {
          setBudgetBySystem(items);
        }
      } catch (error) {
        logger.error(
          "Failed to load budget by system",
          error,
          {
            feature: "dashboard",
            action: "loadBudgetBySystem"
          }
        );

        if (isMounted) {
          setBudgetBySystem([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadBudgetBySystem();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardChartCard title="חלוקת תקציב לפי מערכת">
      {loading ? (
        <p className="empty-text">טוען נתונים...</p>
      ) : budgetBySystem.length === 0 ? (
        <p className="empty-text">אין נתוני תקציב להצגה.</p>
      ) : (
        <DashboardHorizontalBars items={budgetBySystem} />
      )}
    </DashboardChartCard>
  );
}