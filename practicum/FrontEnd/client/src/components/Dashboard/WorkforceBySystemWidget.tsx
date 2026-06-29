import { useEffect, useState } from "react";
import DashboardChartCard from "./DashboardChartCard";
import DashboardHorizontalBars from "./DashboardHorizontalBars";
import { systemService } from "../../services/systemService";

const chartColors = ["#1f6db3", "#149584", "#7550b9", "#6c7d13", "#cb6a0b"];

interface WorkforceBarItem {
  label: string;
  value: number;
  color: string;
}

function toChartItems(totalsBySystem: Map<string, number>): WorkforceBarItem[] {
  return Array.from(totalsBySystem.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: chartColors[index % chartColors.length]
    }));
}

export default function WorkforceBySystemWidget() {
  const [workforceBySystem, setWorkforceBySystem] = useState<WorkforceBarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadWorkforceBySystem = async () => {
      if (isMounted) {
        setLoading(true);
      }

      try {
        const systems = await systemService.getSystems();

        const totalsBySystem = new Map<string, number>();

        systems.forEach((system) => {
          const systemName = system.name?.trim() || "לא מוגדר";
          const allocatedMonths = system.allocatedMonths || 0;
          totalsBySystem.set(
            systemName,
            (totalsBySystem.get(systemName) ?? 0) + allocatedMonths
          );
        });

        const chartItems = toChartItems(totalsBySystem);

        if (isMounted) {
          setWorkforceBySystem(chartItems);
        }
      } catch (error) {
        console.error("Failed to load workforce demand by system", error);
        if (isMounted) {
          setWorkforceBySystem([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadWorkforceBySystem();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardChartCard title="ביקוש כוח עבודה לפי מערכת">
      {loading ? (
        <p className="empty-text">טוען נתונים...</p>
      ) : workforceBySystem.length === 0 ? (
        <p className="empty-text">אין נתוני הקצאה להצגה.</p>
      ) : (
        <DashboardHorizontalBars items={workforceBySystem} />
      )}
    </DashboardChartCard>
  );
}