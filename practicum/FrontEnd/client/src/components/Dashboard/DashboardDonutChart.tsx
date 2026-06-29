import "./DashboardDonutChart.css";

interface DonutItem {
	label: string;
	value: number;
	color: string;
}

interface DashboardDonutChartProps {
	items: DonutItem[];
	centerValue?: number | string;
	footerLines?: string[];
}

export default function DashboardDonutChart({
	items,
	centerValue,
	footerLines
}: DashboardDonutChartProps) {
	const total = items.reduce((sum, item) => sum + item.value, 0);
	const safeTotal = total > 0 ? total : 1;
	const centerText = centerValue ?? total;

	let progress = 0;
	const segments = items
		.filter((item) => item.value > 0)
		.map((item) => {
			const start = (progress / safeTotal) * 100;
			progress += item.value;
			const end = (progress / safeTotal) * 100;
			return `${item.color} ${start}% ${end}%`;
		});

	const donutFill = segments.length
		? `conic-gradient(${segments.join(", ")})`
		: "conic-gradient(#e6e6e6 0% 100%)";

	return (
		<div className="dashboard-donut-chart">
			<div className="dashboard-donut-legend">
				{items.map((item) => (
					<div className="dashboard-donut-legend-row" key={item.label}>
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
