import type { ReactNode } from "react";
import "./DashboardChartsGrid.css";

interface DashboardChartsGridProps {
  children: ReactNode;
}

export default function DashboardChartsGrid({ children }: DashboardChartsGridProps) {
  return <section className="dashboard-charts-grid">{children}</section>;
}