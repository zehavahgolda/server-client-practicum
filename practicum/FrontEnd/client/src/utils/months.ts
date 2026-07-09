export const MAX_MONTHS = 12;
const HALF_MONTH_FACTOR = 2;
const HALF_MONTH_EPSILON = 1e-9;

// מעגל ערך לחצאי חודשים בלבד (0.5).
export function roundToHalfMonth(value: number): number {
  return Math.round(value * HALF_MONTH_FACTOR) / HALF_MONTH_FACTOR;
}

// בודק האם הערך הוא מכפלה חוקית של חצי חודש.
export function isHalfMonthIncrement(value: number): boolean {
  if (!Number.isFinite(value)) return false;

  const doubled = value * HALF_MONTH_FACTOR;
  return Math.abs(doubled - Math.round(doubled)) < HALF_MONTH_EPSILON;
}

// מנרמל ערך חודשים לטווח חוקי ולמדרגת חצי חודש.
export function normalizeMonthValue(
  value: number,
  options: {
    min?: number;
    max?: number;
  } = {}
): number {
  const { min = 0, max = MAX_MONTHS } = options;

  if (!Number.isFinite(value)) {
    return min;
  }

  const roundedValue = roundToHalfMonth(value);

  if (roundedValue < min) return min;
  if (roundedValue > max) return max;

  return roundedValue;
}

// מאמת שערך חודשים חוקי בטווח ומבוסס רק על חצאי חודשים.
export function isValidHalfMonthValue(
  value: number,
  options: {
    min?: number;
    max?: number;
  } = {}
): boolean {
  const { min = 0, max = MAX_MONTHS } = options;

  if (!Number.isFinite(value)) return false;
  if (value < min || value > max) return false;

  return isHalfMonthIncrement(value);
}
