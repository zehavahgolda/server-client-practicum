import {
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";

import DashboardChartCard from "../charts/DashboardChartCard";
import DashboardHorizontalBars from "../charts/DashboardHorizontalBars";

import {
  getDashboardChartColor
} from "../../../constants/dashboardChartColors";
import { logger } from "../../../services/logging/logger";
import { systemService } from "../../../services/systemService";

// מודל נתון עבור שורת גרף ביקוש:
// מזהה מערכת, שם מערכת, ערך ביקוש וצבע תצוגה.
interface WorkforceBarItem {
  systemId: string;
  label: string;
  value: number;
  color: string;
}

// ווידג'ט המציג ביקוש כוח עבודה
// לפי מערכת בגרף עמודות אופקי.
export default function WorkforceBySystemWidget() {
  const navigate = useNavigate();

  const [
    workforceBySystem,
    setWorkforceBySystem
  ] = useState<WorkforceBarItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    // טוען את המערכות מהשרת ומכין אותן לגרף.
    // מזהה המערכת נשמר בכל פריט,
    // כדי שהלחיצה תפתח את המערכת עצמה.
    async function loadWorkforceBySystem() {
      try {
        const systems =
          await systemService.getSystems();

        const items: WorkforceBarItem[] =
          systems
            .map((system) => ({
              systemId: system.id,
              label: system.name,
              value:
                system.requiredCapacityMonths ||
                0,
              color:
                getDashboardChartColor(
                  system.name
                )
            }))
            .filter(
              (item) =>
                item.value > 0 &&
                Boolean(item.systemId)
            )
            .sort(
              (
                firstItem,
                secondItem
              ) =>
                secondItem.value -
                firstItem.value
            );

        if (isMounted) {
          setWorkforceBySystem(items);
        }
      } catch (error) {
        logger.error(
          "Failed to load workforce demand by system",
          error,
          {
            feature: "dashboard",
            action:
              "loadWorkforceBySystem"
          }
        );

        if (isMounted) {
          setWorkforceBySystem([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadWorkforceBySystem();

    return () => {
      isMounted = false;
    };
  }, []);

  // פותח ישירות את פרופיל המערכת
  // בעמוד המערכות.
  function openSystem(
    systemId: string
  ) {
    navigate(
      `/systems?view=all&systemId=${encodeURIComponent(
        systemId
      )}`
    );
  }

  return (
    <DashboardChartCard title="ביקוש כוח עבודה לפי מערכת">
      {loading ? (
        <p className="empty-text">
          טוען נתונים...
        </p>
      ) : workforceBySystem.length ===
        0 ? (
        <p className="empty-text">
          אין נתוני ביקוש להצגה.
        </p>
      ) : (
        <DashboardHorizontalBars
          items={workforceBySystem}
          onItemClick={(item) =>
            openSystem(item.systemId)
          }
        />
      )}
    </DashboardChartCard>
  );
}