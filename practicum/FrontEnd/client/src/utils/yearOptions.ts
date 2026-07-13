export interface YearOption {
  value: number | "";
  label: string;
}

// Returns the current active year for filters requiring a concrete default.
export function getActiveYear(): number {
  return new Date().getFullYear();
}

// Builds year filter options around the active year, including "all years".
export function buildYearOptions(activeYear: number): YearOption[] {
  return [
    { value: "", label: "כל השנים" },
    { value: activeYear - 1, label: String(activeYear - 1) },
    { value: activeYear, label: String(activeYear) },
    { value: activeYear + 1, label: String(activeYear + 1) }
  ];
}
