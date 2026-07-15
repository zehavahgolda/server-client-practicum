
import "./DashboardDonutChart.css";

// פריט יחיד בדונאט: תווית, ערך וצבע.
interface DonutItem {
  label: string;
  value: number;
  color: string;
}

type DashboardDonutChartVariant =
  | "default"
  | "categories"
  | "statuses";

// מאפייני קומפוננטת הדונאט.
interface DashboardDonutChartProps {
  items: DonutItem[];
  centerValue?: number | string;
  centerLabel?: string;
  footerLines?: string[];
  onItemClick?: (item: DonutItem) => void;
  variant?: DashboardDonutChartVariant;
}

// מציגה תרשים דונאט עם אגדה וטקסט מרכזי.
export default function DashboardDonutChart({
  items,
  centerValue,
  centerLabel,
  footerLines,
  onItemClick,
  variant = "default"
}: DashboardDonutChartProps) {
  const total = items.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const safeTotal = total > 0 ? total : 1;
  const centerText = centerValue ?? total;

  let progress = 0;

  const segments = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const start =
        (progress / safeTotal) * 100;

      progress += item.value;

      const end =
        (progress / safeTotal) * 100;

      return `${item.color} ${start}% ${end}%`;
    });

  const donutFill = segments.length
    ? `conic-gradient(${segments.join(", ")})`
    : "conic-gradient(#e6e6e6 0% 100%)";

  return (
    <div
      className={[
        "dashboard-donut-chart",
        `dashboard-donut-chart--${variant}`
      ].join(" ")}
    >
      <div className="dashboard-donut-visual">
        <div
          className="dashboard-donut-ring"
          style={{
            backgroundImage: donutFill
          }}
        >
          <div className="dashboard-donut-center">
            <strong>{centerText}</strong>

            {(centerLabel ||
              variant === "categories") && (
              <span>
                {centerLabel ?? "עובדים"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-donut-legend">
        {items.map((item) => {
          const percentage =
            total > 0
              ? Math.round(
                  (item.value / total) * 100
                )
              : 0;

          return (
            <div
              className={[
                "dashboard-donut-legend-row",
                onItemClick
                  ? "is-clickable"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={item.label}
              onClick={(event) => {
                event.stopPropagation();
                onItemClick?.(item);
              }}
              onKeyDown={(event) => {
                if (!onItemClick) {
                  return;
                }

                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  onItemClick(item);
                }
              }}
              role={
                onItemClick
                  ? "button"
                  : undefined
              }
              tabIndex={
                onItemClick ? 0 : undefined
              }
            >
              <div className="dashboard-donut-legend-heading">
                <div className="dashboard-donut-legend-name">
                  <span
                    className="dashboard-donut-legend-dot"
                    style={{
                      backgroundColor:
                        item.color
                    }}
                  />

                  <span className="dashboard-donut-legend-label">
                    {item.label}
                  </span>
                </div>

                <div className="dashboard-donut-legend-numbers">
                  <strong>{item.value}</strong>

                  {variant === "categories" && (
                    <span>
                      {percentage}%
                    </span>
                  )}

                  {variant === "statuses" && (
                    <span>מערכות</span>
                  )}
                </div>
              </div>

              {variant === "categories" && (
                <div className="dashboard-donut-progress">
                  <span
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        item.color
                    }}
                  />
                </div>
              )}

              {variant === "statuses" && (
                <div className="dashboard-donut-status-progress">
                  <span
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        item.color
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {footerLines &&
          footerLines.length > 0 && (
            <div className="dashboard-donut-footer">
              {footerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}