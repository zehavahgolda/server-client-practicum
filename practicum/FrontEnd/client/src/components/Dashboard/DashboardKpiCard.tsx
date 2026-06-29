import "./DashboardKpiCard.css";

type KpiVariant = "default" | "orange" | "blue" | "red";

interface DashboardKpiCardProps {
  title: string;
  value: string;
  description: string;
  variant?: KpiVariant;
}

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