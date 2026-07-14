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
export function matchesStatus(system: System, status: UiStatus): boolean {
  if (status === "all") return true;
  return getSystemTone(system) === status;
}

// Performs free-text search over relevant system fields.
export function matchesSearch(system: System, search: string): boolean {
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
    .filter((item) => item !== undefined && item !== null)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(value);
}

// Groups systems by business status (excess / balanced / shortage).
export function getStatusGroups(systems: System[]) {
  return {
    excess: systems.filter((system) => system.gap < 0),
    balanced: systems.filter((system) => system.gap === 0),
    shortage: systems.filter((system) => system.gap > 0)
  };
}

// Groups systems by capacity-gap severity.
export function getGapGroups(systems: System[]) {
  return {
    healthy: systems.filter((system) => system.gap <= 0),
    regularShortage: systems.filter(
      (system) => system.gap > 0 && system.gap <= 4
    ),
    criticalShortage: systems.filter((system) => system.gap > 4)
  };
}
