import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useEmployees } from "../../../hooks/useEmployees";
import { getCategoryColor } from "../../../constants/categoryColors";

import DashboardChartCard from "../charts/DashboardChartCard";
import DashboardDonutChart from "../charts/DashboardDonutChart";

// ווידג'ט המציג התפלגות עובדים לפי קטגוריה מקצועית.
export default function EmployeesByCategoryWidget() {
  const navigate = useNavigate();
  const { employees } = useEmployees({ year: 2026 });

  // מחשב את מספר העובדים בכל קטגוריה,
  // ממיין מהקטגוריה הגדולה לקטנה
  // ומעניק לכל קטגוריה צבע קבוע לפי שמה.
  const employeesByCategory = useMemo(() => {
    const counts = new Map<string, number>();

    employees.forEach((employee) => {
      const category =
        employee.professionalCategory?.trim() ||
        "לא מוגדר";

      counts.set(
        category,
        (counts.get(category) ?? 0) + 1
      );
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
      .map(([label, value]) => ({
        label,
        value,
        color: getCategoryColor(label)
      }));
  }, [employees]);

  // פתיחת תמונת המצב הכוללת של הקטגוריות.
  function openAllCategories() {
    navigate("/employees?view=category");
  }

  // פתיחת הקטגוריה שעליה המשתמש לחץ.
  function openSelectedCategory(
    categoryName: string
  ) {
    navigate(
      `/employees?view=category&professionalCategory=${encodeURIComponent(
        categoryName
      )}`
    );
  }

  return (
    <DashboardChartCard
      title="עובדים לפי קטגוריה"
      onClick={openAllCategories}
    >
      <DashboardDonutChart
        items={employeesByCategory}
        centerValue={employees.length}
        centerLabel="עובדים"
        variant="categories"
        footerLines={[
          "לחיצה על קטגוריה פותחת אותה · לחיצה על הכרטיס מציגה את כולן"
        ]}
        onItemClick={(item) =>
          openSelectedCategory(item.label)
        }
      />
    </DashboardChartCard>
  );
}