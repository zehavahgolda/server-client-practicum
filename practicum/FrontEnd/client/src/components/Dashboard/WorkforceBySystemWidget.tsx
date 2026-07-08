import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardChartCard from "./DashboardChartCard";
import DashboardHorizontalBars from "./DashboardHorizontalBars";
import { systemService } from "../../services/systemService";

// פלטת צבעים קבועה לגרף ביקוש כוח עבודה לפי מערכות.
const chartColors = ["#1f6db3", "#149584", "#7550b9", "#6c7d13", "#cb6a0b", "#b43135", "#4f8f5b"];

// מודל נתון עבור שורת גרף ביקוש: מערכת, ערך וצבע.
interface WorkforceBarItem {
  label: string;
  value: number;
  color: string;
}

// ווידג'ט המציג ביקוש כוח עבודה לפי מערכת בגרף עמודות אופקי.
export default function WorkforceBySystemWidget() {
  const navigate = useNavigate();
  const [workforceBySystem, setWorkforceBySystem] = useState<WorkforceBarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // טוען נתוני מערכות, ממיר לערכי ביקוש, מסנן/ממיין ומוסיף צבע לכל שורה.
    async function loadWorkforceBySystem() {
      try {
        const systems = await systemService.getSystems();

        const items = systems
          .map((system) => ({
            label: system.name,
            value: system.requiredCapacityMonths || 0
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((item, index) => ({
            ...item,
            color: chartColors[index % chartColors.length]
          }));

        if (isMounted) {
          setWorkforceBySystem(items);
        }
      } catch (error) {
        console.error("Failed to load workforce demand by system", error);
        if (isMounted) setWorkforceBySystem([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadWorkforceBySystem();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardChartCard
      title="ביקוש כוח עבודה לפי מערכת"
      onClick={() => navigate("/systems?view=gap")}
    >
      {loading ? (
        <p className="empty-text">טוען נתונים...</p>
      ) : workforceBySystem.length === 0 ? (
        <p className="empty-text">אין נתוני ביקוש להצגה.</p>
      ) : (
        <DashboardHorizontalBars
          items={workforceBySystem}
          onItemClick={(item) =>
            navigate(`/systems?view=gap&search=${encodeURIComponent(item.label)}`)
          }
        />
      )}
    </DashboardChartCard>
  );
}