import { useMemo } from "react";
import { useSystems } from "../../hooks/useSystems";
import DashboardChartCard from "./DashboardChartCard";
import DashboardDonutChart from "./DashboardDonutChart";

// מיפוי קבוצות סטטוס עם כינויים אפשריים וצבע תצוגה לכל קבוצה.
const statusGroups = [
  {
    label: "בעודף",
    aliases: ["Over Capacity", "Excess", "בעודף", "עודף"],
    color: "#1f6db3"
  },
  {
    label: "במחסור",
    aliases: ["Under Capacity", "Shortage", "בחוסר", "במחסור", "חוסר"],
    color: "#b43135"
  },
  {
    label: "מאוזן",
    aliases: ["Balanced", "מאוזן"],
    color: "#149584"
  }
];

// ווידג'ט המציג התפלגות מערכות לפי סטטוס קיבולת.
export default function SystemsStatusWidget() {
  const { systems } = useSystems();

  // מחשב כמה מערכות שייכות לכל קבוצת סטטוס לפי הכינויים שהוגדרו.
  const systemsByStatus = useMemo(
    () =>
      statusGroups.map((group) => {
        const value = systems.reduce((count, system) => {
          const status = system.capacityStatus?.trim() || "";
          return group.aliases.includes(status) ? count + 1 : count;
        }, 0);

        return { label: group.label, value, color: group.color };
      }),
    [systems]
  );

  return (
    <DashboardChartCard title="מערכות לפי סטטוס">
      <DashboardDonutChart
        items={systemsByStatus}
        centerValue={systems.length}
        footerLines={[`סה"כ מערכות: ${systems.length}`]}
      />
    </DashboardChartCard>
  );
}