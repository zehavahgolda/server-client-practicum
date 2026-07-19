import type { System } from "../types";

export type SystemTone = "shortage" | "balanced" | "excess";
export type UiStatus = "all" | "shortage" | "balanced" | "excess";

// Maps a system to a visual status tone based on capacity gap.
export function getSystemTone(system: System): SystemTone {
  if (system.gap > 0) return "shortage";
  if (system.gap < 0) return "excess";
  return "balanced";
}

// Checks whether a system matches the selected UI status.
export function matchesStatus(
  system: System,
  status: UiStatus
): boolean {
  if (status === "all") return true;
  return getSystemTone(system) === status;
}

// Performs free-text search over relevant system fields.
export function matchesSearch(
  system: System,
  search: string
): boolean {
  const value = search.trim().toLowerCase();

  if (!value) return true;

  const searchableText = [
    system.name,
    system.capacityStatus,
    system.managementNote,
    system.requiredCapacityMonths,
    system.allocatedMonths,
    system.gap,
    system.assignedEmployeesCount
  ]
    .filter(
      (item) =>
        item !== undefined &&
        item !== null
    )
    .join(" ")
    .toLowerCase();

  return searchableText.includes(value);
}

// Groups systems into the three capacity states used throughout the UI.
export function getStatusGroups(
  systems: System[]
) {
  return {
    excess: systems.filter(
      (system) => system.gap < 0
    ),
    balanced: systems.filter(
      (system) => system.gap === 0
    ),
    shortage: systems.filter(
      (system) => system.gap > 0
    )
  };
}

// The capacity-gap grouped view uses the same three clear states:
// excess, balanced and shortage.
// This keeps titles, colors and card contents consistent.
export function getGapGroups(
  systems: System[]
) {
  return {
    excess: systems.filter(
      (system) => system.gap < 0
    ),
    balanced: systems.filter(
      (system) => system.gap === 0
    ),
    shortage: systems.filter(
      (system) => system.gap > 0
    )
  };
}