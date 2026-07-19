// פלטת צבעים אחידה עבור גרפי המערכות בדשבורד.
//
// לכל מערכת ניתן צבע קבוע לפי שמה.
// אם יש יותר מ־12 מערכות, הפלטה חוזרת על עצמה.
//
// הפלטה הכללית נשארת בגווני כחול,
// משום שהיא משמשת גרפים שבהם הצבעים רק מבדילים
// בין מערכות שונות ואינם מייצגים סטטוס עסקי.
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

// צבעי סטטוס ייעודיים לדשבורד.
//
// הם שומרים על אותה משמעות עסקית:
// - עודף: כתום
// - מאוזן: ירוק־טורקיז
// - מחסור: אדום
//
// הגוונים רכים ומעודנים יותר כדי להשתלב
// בשפה החזותית של הדשבורד.
export const DASHBOARD_STATUS_COLORS = {
  excess: "#D99A3D",
  balanced: "#3A9D8F",
  shortage: "#C95A61"
} as const;

// יוצר ערך מספרי קבוע מתוך טקסט,
// כדי שאותה מערכת תקבל תמיד את אותו צבע.
function createHash(value: string): number {
  let hash = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(index)) |
      0;
  }

  return Math.abs(hash);
}

// מחזיר צבע קבוע למערכת לפי שמה.
export function getDashboardChartColor(
  label: string
): string {
  const normalizedLabel =
    label.trim().toLowerCase();

  const index =
    createHash(normalizedLabel) %
    DASHBOARD_CHART_COLORS.length;

  return DASHBOARD_CHART_COLORS[index];
}