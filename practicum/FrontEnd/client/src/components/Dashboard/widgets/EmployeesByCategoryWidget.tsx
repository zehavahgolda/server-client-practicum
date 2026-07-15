import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useEmployees } from "../../../hooks/useEmployees";

import DashboardChartCard from "../charts/DashboardChartCard";
import DashboardDonutChart from "../charts/DashboardDonutChart";

// פלטת צבעים להצגת קטגוריות עובדים בדונאט.
const categoryColors = [
  "#1f6db3",
  "#149584",
  "#7550b9",
  "#cb6a0b",
  "#d1495b",
  "#4f8f5b",
  "#2563a8",
  "#15998c",
  "#7652bc",
  "#c7670d"
];

// ווידג'ט המציג התפלגות עובדים לפי קטגוריה מקצועית.
export default function EmployeesByCategoryWidget() {
  const navigate = useNavigate();
  const { employees } = useEmployees({ year: 2026 });

  // מחשב את מספר העובדים בכל קטגוריה,
  // ממיין מהקטגוריה הגדולה לקטנה ומוסיף צבע תצוגה.
  const employeesByCategory = useMemo(() => {
    const counts = new Map<string, number>();

    employees.forEach((employee) => {
      const category =
        employee.professionalCategory?.trim() || "לא מוגדר";

      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort(
        (
          [firstLabel, firstValue],
          [secondLabel, secondValue]
        ) => {
          const valueDifference =
            secondValue - firstValue;

          if (valueDifference !== 0) {
            return valueDifference;
          }

          return firstLabel.localeCompare(
            secondLabel,
            "he"
          );
        }
      )
      .map(([label, value], index) => ({
        label,
        value,
        color:
          categoryColors[index % categoryColors.length]
      }));
  }, [employees]);

  return (
    <DashboardChartCard
      title="עובדים לפי קטגוריה"
      onClick={() =>
        navigate("/employees?view=category")
      }
    >
      <DashboardDonutChart
        items={employeesByCategory}
        centerValue={employees.length}
        variant="categories"
        onItemClick={(item) =>
          navigate(
            `/employees?view=category&professionalCategory=${encodeURIComponent(
              item.label
            )}`
          )
        }
      />
    </DashboardChartCard>
  );
}