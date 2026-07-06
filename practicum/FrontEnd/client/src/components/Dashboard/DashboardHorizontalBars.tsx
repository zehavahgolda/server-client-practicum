import "./DashboardHorizontalBars.css";

// פריט יחיד בגרף עמודות אופקי: שם, ערך וצבע.
interface BarItem {
  label: string;
  value: number;
  color: string;
}

// מאפייני הקומפוננטה להצגת רשימת עמודות אופקיות.
interface DashboardHorizontalBarsProps {
  items: BarItem[];
}

// מציגה גרף עמודות אופקי שבו כל רוחב עמודה מחושב ביחס למקסימום.
export default function DashboardHorizontalBars({
  items
}: DashboardHorizontalBarsProps) {
  // משמש לנרמול רוחב כל עמודה לאחוז יחסי מהערך הגבוה ביותר.
  const maxValue = Math.max(...items.map((item) => item.value), 1);

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