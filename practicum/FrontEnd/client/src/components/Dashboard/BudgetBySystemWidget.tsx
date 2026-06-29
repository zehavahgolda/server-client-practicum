import DashboardChartCard from "./DashboardChartCard";
import DashboardHorizontalBars from "./DashboardHorizontalBars";

const budgetBySystem = [
  { label: "ServiceNow", value: 560000, color: "#1f6db3" },
  { label: "מערכת פנים", value: 504000, color: "#149584" },
  { label: "GIS ארגוני", value: 392000, color: "#7550b9" },
  { label: "BI ניהולי", value: 308000, color: "#6c7d13" },
  { label: "מודול סייבר", value: 280000, color: "#cb6a0b" }
];

export default function BudgetBySystemWidget() {
  return (
    <DashboardChartCard title="חלוקת תקציב לפי מערכת">
      <DashboardHorizontalBars items={budgetBySystem} />
    </DashboardChartCard>
  );
}