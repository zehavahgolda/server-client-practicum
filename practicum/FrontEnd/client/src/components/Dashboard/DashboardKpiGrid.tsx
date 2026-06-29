import DashboardKpiCard from "./DashboardKpiCard";
import "./DashboardKpiGrid.css";

export default function DashboardKpiGrid() {
  return (
    <section className="dashboard-kpi-grid">
      <DashboardKpiCard
        title="ניצול תקציב"
        value="49%"
        description="₪2,044,000 מתוך ₪4,144,000"
        variant="orange"
      />

      <DashboardKpiCard
        title="מצב כללי"
        value="40%"
        description="0 מאוזנות/עובדף"
        variant="blue"
      />

      <DashboardKpiCard
        title="ניצול קיבולת"
        value="78%"
        description="73 מתוך 93"
      />

      <DashboardKpiCard
        title="פער קיבולת כולל"
        value="75"
        description="חודשי עבודה חסרים"
        variant="red"
      />

      <DashboardKpiCard
        title="0"
        value="0"
        description="לא תקין - יש מערכות בחוסר"
        variant="red"
      />
    </section>
  );
}