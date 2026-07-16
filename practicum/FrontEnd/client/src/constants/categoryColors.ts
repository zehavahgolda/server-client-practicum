// פלטה מרכזית של 12 גווני כחול עבור קטגוריות מקצועיות.
// אם יש יותר מ־12 קטגוריות, הצבעים חוזרים על עצמם.
export const CATEGORY_COLORS = [
  "#174A7E",
  "#1F5F99",
  "#256FB5",
  "#2F80C9",
  "#3A8FD8",
  "#479DE2",
  "#56AAE8",
  "#68B6ED",
  "#7AC2F1",
  "#2389A8",
  "#2A7698",
  "#315F8C"
] as const;

// יוצר מספר קבוע מתוך שם הקטגוריה,
// כדי שאותה קטגוריה תקבל תמיד אותו צבע.
function createStableCategoryHash(
  categoryName: string
): number {
  let hash = 0;

  for (
    let index = 0;
    index < categoryName.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        categoryName.charCodeAt(index)) |
      0;
  }

  return Math.abs(hash);
}

// מחזיר צבע קבוע לפי שם הקטגוריה.
export function getCategoryColor(
  categoryName: string
): string {
  const normalizedCategoryName =
    categoryName
      .trim()
      .toLocaleLowerCase("he");

  const safeCategoryName =
    normalizedCategoryName || "לא מוגדר";

  const colorIndex =
    createStableCategoryHash(
      safeCategoryName
    ) % CATEGORY_COLORS.length;

  return CATEGORY_COLORS[colorIndex];
}