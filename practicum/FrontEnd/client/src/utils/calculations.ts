import type { EmployeeListItem } from "../types/employee";
import type { System } from "../types/system";
import type { KPIMetrics } from "../types/kpi";

// מחשבת מדדי KPI מרכזיים לפי נתוני עובדים ומערכות.
export const calculateKPIs = (employees: EmployeeListItem[], systems: System[]): KPIMetrics => {
  // Systems analysis
  const systemsAtRisk = systems.filter((s) => s.gap > 4).length;
  const systemsInShortage = systems.filter((s) => s.gap > 0 && s.gap <= 4).length;
  const systemsBalanced = systems.filter((s) => s.gap === 0 || s.gap < 0).length;

  // Capacity analysis
  const totalGap = systems.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
  const surplus = systems.reduce((sum, s) => sum + Math.abs(Math.min(0, s.gap)), 0);
  const totalCapacity = employees.reduce((sum, e) => sum + e.yearlyCapacityMonths, 0);
  const totalAllocated = employees.reduce((sum, e) => sum + e.allocatedMonths, 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  // Employee stress
  const lowCapacityEmployees = employees.filter((e) => e.remainingMonths <= 1).length;

  // Health score calculation
  const healthFactors = [
    systemsBalanced / (systems.length || 1),
    Math.max(0, 1 - (totalGap / (totalCapacity || 1))),
    Math.max(0, 1 - (lowCapacityEmployees / (employees.length || 1)))
  ];
  const healthScore = Math.round((healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length) * 100);

  return {
    systemsAtRisk,
    systemsInShortage,
    systemsBalanced,
    totalGap,
    surplus,
    utilizationRate,
    lowCapacityEmployees,
    healthScore
  };
};

// מחזירה צבע סטטוס לתצוגה לפי ערך הסטטוס.
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "excess" || normalizedStatus === "surplus") {
    return "var(--status-surplus)";
  }

  if (normalizedStatus === "shortage" || normalizedStatus === "at risk" || normalizedStatus === "risk") {
    return "var(--status-danger)";
  }

  return "var(--status-success)";
};

// ממפה ערך פער לקטגוריית טון: חוסר, עודף או מאוזן.
export const getGapTone = (gap: number): "shortage" | "surplus" | "balanced" => {
  if (gap > 0) {
    return "shortage";
  }

  if (gap < 0) {
    return "surplus";
  }

  return "balanced";
};
