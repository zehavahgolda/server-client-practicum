// פלטת צבעים אחידה עבור כל גרפי המערכות בדשבורד.
// לכל מערכת יינתן צבע קבוע לפי שמה.
// אם יש יותר מ־12 מערכות, הפלטה חוזרת על עצמה.

export const DASHBOARD_CHART_COLORS = [
  "#1D4ED8",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#38BDF8",
  "#0EA5E9",
  "#0284C7",
  "#0369A1",
  "#075985",
  "#1E40AF",
  "#1E3A8A",
  "#312E81"
] as const;

function createHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

export function getDashboardChartColor(
  label: string
): string {
  const index =
    createHash(label.trim().toLowerCase()) %
    DASHBOARD_CHART_COLORS.length;

  return DASHBOARD_CHART_COLORS[index];
}