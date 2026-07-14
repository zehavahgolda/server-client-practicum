import type { ReactNode } from "react";
import "./DashboardChartCard.css";

// מגדיר את מאפייני הכרטיס: כותרת ותוכן פנימי דינמי.
interface DashboardChartCardProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
}

// מעטפת תצוגה אחידה לכל גרף/ווידג'ט בדשבורד עם Header ו-Body.
export default function DashboardChartCard({
  title,
  children,
  onClick
}: DashboardChartCardProps) {
  return (
    <section
      className={`dashboard-chart-card ${onClick ? "is-clickable" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <header className="dashboard-chart-card-header">
        <h3>{title}</h3>
      </header>

      <div className="dashboard-chart-card-body">
        {children}
      </div>
    </section>
  );
}