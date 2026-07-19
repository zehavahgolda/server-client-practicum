import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useSystems } from "../../../hooks/useSystems";

import {
  DASHBOARD_STATUS_COLORS
} from "../../../constants/dashboardChartColors";

import DashboardChartCard from "../charts/DashboardChartCard";
import DashboardDonutChart from "../charts/DashboardDonutChart";

// סוגי הסטטוס העסקיים של מערכת.
type DashboardSystemStatus =
  | "excess"
  | "balanced"
  | "shortage";

// הגדרת קבוצות הסטטוס המוצגות בדשבורד.
const statusGroups: Array<{
  key: DashboardSystemStatus;
  label: string;
  color: string;
}> = [
  {
    key: "excess",
    label: "בעודף",
    color: DASHBOARD_STATUS_COLORS.excess
  },
  {
    key: "shortage",
    label: "במחסור",
    color: DASHBOARD_STATUS_COLORS.shortage
  },
  {
    key: "balanced",
    label: "מאוזן",
    color: DASHBOARD_STATUS_COLORS.balanced
  }
];

// קובע את מצב המערכת לפי פער הקיבולת.
//
// אותה לוגיקה משמשת גם במסך המערכות:
// gap > 0   = מחסור
// gap < 0   = עודף
// gap === 0 = מאוזן
function getSystemStatus(
  gap: number
): DashboardSystemStatus {
  if (gap > 0) {
    return "shortage";
  }

  if (gap < 0) {
    return "excess";
  }

  return "balanced";
}

// ווידג'ט המציג התפלגות מערכות לפי סטטוס קיבולת.
export default function SystemsStatusWidget() {
  const navigate = useNavigate();
  const { systems } = useSystems();

  // מחשב כמה מערכות שייכות לכל קבוצת סטטוס.
  //
  // החישוב מתבצע לפי gap ולא לפי טקסט capacityStatus,
  // כדי לשמור על התאמה מלאה למסך המערכות.
  const systemsByStatus = useMemo(
    () =>
      statusGroups.map((group) => {
        const value = systems.filter(
          (system) =>
            getSystemStatus(system.gap) === group.key
        ).length;

        return {
          label: group.label,
          value,
          color: group.color
        };
      }),
    [systems]
  );

  // פותח את תמונת המצב הכוללת לפי סטטוס.
  function openStatusOverview() {
    navigate("/systems?view=status");
  }

  // פותח את קבוצת הסטטוס שנבחרה.
  function openSelectedStatus(
    label: string
  ) {
    const normalizedLabel = label.trim();

    if (normalizedLabel === "במחסור") {
      navigate(
        "/systems?view=status&status=shortage"
      );
      return;
    }

    if (normalizedLabel === "מאוזן") {
      navigate(
        "/systems?view=status&status=balanced"
      );
      return;
    }

    navigate(
      "/systems?view=status&status=excess"
    );
  }

  return (
    <DashboardChartCard
      title="מערכות לפי סטטוס"
      onClick={openStatusOverview}
    >
      <DashboardDonutChart
        items={systemsByStatus}
        centerValue={systems.length}
        centerLabel="מערכות"
        variant="statuses"
        footerLines={[
          `סה"כ ${systems.length} מערכות`
        ]}
        onItemClick={(item) =>
          openSelectedStatus(item.label)
        }
      />
    </DashboardChartCard>
  );
}