import "./DashboardHorizontalBars.css";

// המבנה הבסיסי שכל פריט בגרף חייב להכיל.
// קומפוננטות משתמשות יכולות להוסיף שדות נוספים,
// למשל systemId.
export interface BarItem {
  label: string;
  value: number;
  color: string;
}

// מאפייני הקומפוננטה.
// השימוש ב־Generic שומר על כל השדות הנוספים של הפריט,
// ולכן callback הלחיצה מקבל את הטיפוס המדויק.
interface DashboardHorizontalBarsProps<
  TItem extends BarItem
> {
  items: TItem[];
  onItemClick?: (item: TItem) => void;
}

// מציגה גרף עמודות אופקי שבו
// רוחב כל עמודה מחושב ביחס לערך המקסימלי.
export default function DashboardHorizontalBars<
  TItem extends BarItem
>({
  items,
  onItemClick
}: DashboardHorizontalBarsProps<TItem>) {
  // משמש לנרמול רוחב כל עמודה
  // לאחוז יחסי מהערך הגבוה ביותר.
  const maxValue = Math.max(
    ...items.map((item) => item.value),
    1
  );

  return (
    <div className="dashboard-horizontal-bars">
      {items.map((item, index) => {
        const isClickable =
          Boolean(onItemClick);

        return (
          <div
            className={[
              "dashboard-horizontal-row",
              isClickable
                ? "is-clickable"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}
            key={`${item.label}-${item.value}-${index}`}
            onClick={(event) => {
              if (!onItemClick) {
                return;
              }

              event.stopPropagation();
              onItemClick(item);
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
              isClickable
                ? "button"
                : undefined
            }
            tabIndex={
              isClickable
                ? 0
                : undefined
            }
            aria-label={
              isClickable
                ? `פתיחת ${item.label}`
                : undefined
            }
          >
            <span className="dashboard-horizontal-value">
              {item.value}
            </span>

            <div className="dashboard-horizontal-track">
              <div
                className="dashboard-horizontal-fill"
                style={{
                  width: `${
                    (item.value / maxValue) *
                    100
                  }%`,
                  backgroundColor:
                    item.color
                }}
              />
            </div>

            <span className="dashboard-horizontal-label">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}