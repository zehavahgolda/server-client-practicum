import "./DashboardDonutChart.css";

// פריט יחיד בדונאט: תווית, ערך וצבע להצגה באגדה ובגרף.
interface DonutItem {
	label: string;
	value: number;
	color: string;
}

// מאפייני קומפוננטת הדונאט: פריטים, ערך מרכזי ושורות Footer אופציונליות.
interface DashboardDonutChartProps {
	items: DonutItem[];
	centerValue?: number | string;
	footerLines?: string[];
	onItemClick?: (item: DonutItem) => void;
}

// מציגה תרשים דונאט עם אגדה וטקסט מרכזי על בסיס רשימת פריטים.
export default function DashboardDonutChart({
	items,
	centerValue,
	footerLines,
	onItemClick
}: DashboardDonutChartProps) {
	// מחשב ערך כולל בטוח כדי למנוע חלוקה באפס בעת יצירת הסגמנטים.
	const total = items.reduce((sum, item) => sum + item.value, 0);
	const safeTotal = total > 0 ? total : 1;
	const centerText = centerValue ?? total;

	// בונה את טווחי הצבעים עבור conic-gradient לפי פרופורציות הפריטים.
	let progress = 0;
	const segments = items
		.filter((item) => item.value > 0)
		.map((item) => {
			const start = (progress / safeTotal) * 100;
			progress += item.value;
			const end = (progress / safeTotal) * 100;
			return `${item.color} ${start}% ${end}%`;
		});

	// מגדיר מילוי ברירת מחדל אפור כאשר אין נתונים חיוביים להצגה.
	const donutFill = segments.length
		? `conic-gradient(${segments.join(", ")})`
		: "conic-gradient(#e6e6e6 0% 100%)";

	return (
		<div className="dashboard-donut-chart">
			<div className="dashboard-donut-legend">
				{items.map((item) => (
					<div
						className={`dashboard-donut-legend-row ${onItemClick ? "is-clickable" : ""}`}
						key={item.label}
						onClick={() => onItemClick?.(item)}
						onKeyDown={(event) => {
							if (!onItemClick) return;
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onItemClick(item);
							}
						}}
						role={onItemClick ? "button" : undefined}
						tabIndex={onItemClick ? 0 : undefined}
					>
						<span className="dashboard-donut-legend-value">{item.value}</span>
						<span className="dashboard-donut-legend-label">{item.label}</span>
						<span
							className="dashboard-donut-legend-dot"
							style={{ backgroundColor: item.color }}
						/>
					</div>
				))}

				{footerLines && footerLines.length > 0 ? (
					<div className="dashboard-donut-footer">
						{footerLines.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
				) : null}
			</div>

			<div className="dashboard-donut-visual">
				<div className="dashboard-donut-ring" style={{ backgroundImage: donutFill }}>
					<div className="dashboard-donut-center">
						<span>{centerText}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
