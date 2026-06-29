import "./DashboardHorizontalBars.css";

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface DashboardHorizontalBarsProps {
  items: BarItem[];
}

export default function DashboardHorizontalBars({
  items
}: DashboardHorizontalBarsProps) {
  const maxValue = Math.max(...items.map((item) => item.value));

  return (
    <div className="dashboard-horizontal-bars">
      {items.map((item) => (
        <div className="dashboard-horizontal-row" key={item.label}>
          <span className="dashboard-horizontal-value">{item.value}</span>

          <div className="dashboard-horizontal-track">
            <div
              className="dashboard-horizontal-fill"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color
              }}
            />
          </div>

          <span className="dashboard-horizontal-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}