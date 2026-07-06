import "./DashboardKpiCard.css";

// וריאציות צבע/סגנון לכרטיס KPI בהתאם למשמעות המדד.
type KpiVariant = "default" | "orange" | "blue" | "red";

// מאפייני הכרטיס: כותרת, ערך מרכזי, תיאור וסגנון אופציונלי.
interface DashboardKpiCardProps {
  title: string;
  value: string;
  description: string;
  variant?: KpiVariant;
}

// קומפוננטת כרטיס KPI בודד להצגת מדד תמציתי בדשבורד.
export default function DashboardKpiCard({
  title,
  value,
  description,
  variant = "default"
}: DashboardKpiCardProps) {
  return (
    <article className={`dashboard-kpi-card dashboard-kpi-card--${variant}`}>
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}