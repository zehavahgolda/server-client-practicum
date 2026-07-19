// פלטת צבעים קבועה עבור קטגוריות עובדים.
// לכל קטגוריה יינתן תמיד אותו צבע לפי שמה.

export const CATEGORY_COLORS = [
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

// יוצר מספר קבוע מתוך שם הקטגוריה.
function createHash(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash =
      (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

// מחזיר צבע קבוע לפי שם הקטגוריה.
export function getCategoryColor(
  category: string
): string {
  const normalized =
    category.trim().toLowerCase();

  const index =
    createHash(normalized) %
    CATEGORY_COLORS.length;

  return CATEGORY_COLORS[index];
}