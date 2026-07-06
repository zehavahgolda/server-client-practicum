import type { ReactNode } from "react";
import "./DashboardChartsGrid.css";

// מאפייני קומפוננטת הגריד שמכילה את כל ווידג'טי הגרפים.
interface DashboardChartsGridProps {
  children: ReactNode;
}

// עוטפת את הילדים בפריסת Grid אחידה למסך הדשבורד.
export default function DashboardChartsGrid({ children }: DashboardChartsGridProps) {
  return <section className="dashboard-charts-grid">{children}</section>;
}