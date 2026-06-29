import type { ReactNode } from "react";
import "./DashboardChartCard.css";

interface DashboardChartCardProps {
  title: string;
  children: ReactNode;
}

export default function DashboardChartCard({
  title,
  children
}: DashboardChartCardProps) {
  return (
    <section className="dashboard-chart-card">
      <header className="dashboard-chart-card-header">
        <h3>{title}</h3>
      </header>

      <div className="dashboard-chart-card-body">
        {children}
      </div>
    </section>
  );
}