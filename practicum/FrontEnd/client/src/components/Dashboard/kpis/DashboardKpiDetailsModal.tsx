import { useMemo, useState } from "react";

import type { System } from "../../../types";

import "../../Employees/cards/EmployeeCard.css";
import "./DashboardKpiDetailsModal.css";

export type DashboardKpiModalMode =
  | "shortage-count"
  | "missing-months"
  | "capacity-gap"
  | "budget";

interface DashboardKpiDetailsModalProps {
  open: boolean;
  mode: DashboardKpiModalMode;
  systems: System[];
  onClose: () => void;
  onAssign: (system: System) => void;
  onEdit: (system: System) => void;
  onOpenProfile: (system: System) => void;
}

interface DashboardKpiSystemCardProps {
  system: System;
  showBudget: boolean;
  onAssign: (system: System) => void;
  onEdit: (system: System) => void;
  onOpenProfile: (system: System) => void;
}

type SystemTone =
  | "shortage"
  | "balanced"
  | "excess";

function getConfig(
  mode: DashboardKpiModalMode
) {
  switch (mode) {
    case "budget":
      return {
        title: "תמונת מצב תקציבית",
        description:
          "רשימת המערכות ומצב ניצול התקציב.",
        showBudget: true
      };

    case "missing-months":
      return {
        title: "חודשי עבודה חסרים",
        description:
          "מערכות שבהן ההקצאה נמוכה מהדרישה.",
        showBudget: false
      };

    case "capacity-gap":
      return {
        title: "פערי קיבולת",
        description:
          "ממויין לפי הפער הגדול ביותר.",
        showBudget: false
      };

    default:
      return {
        title:
          "מערכות הדורשות שיבוץ כוח אדם",
        description:
          "בחרי מערכת כדי לשבץ עובדים, לערוך או לפתוח פרופיל.",
        showBudget: false
      };
  }
}

// מצב הקיבולת של המערכת.
// הפס העליון בכרטיס מייצג רק את מצב כוח האדם.
function getSystemTone(
  system: System
): SystemTone {
  if (system.gap > 0) {
    return "shortage";
  }

  if (system.gap < 0) {
    return "excess";
  }

  return "balanced";
}

function DashboardKpiSystemCard({
  system,
  showBudget,
  onAssign,
  onEdit,
  onOpenProfile
}: DashboardKpiSystemCardProps) {
  const tone = getSystemTone(system);
  const hasShortage = system.gap > 0;
  const hasBudget =
    system.allocatedBudget > 0;

  return (
    <article
      className={[
        "employee-card",
        "dashboard-kpi-system-card",
        tone,
        showBudget
          ? "dashboard-kpi-system-card--budget"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      dir="rtl"
      role="button"
      tabIndex={0}
      onClick={() =>
        onOpenProfile(system)
      }
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onOpenProfile(system);
        }
      }}
    >
      <div className="dashboard-kpi-system-content">
        <div className="employee-card-top">
          <div className="employee-card-title dashboard-kpi-system-title">
            <strong>{system.name}</strong>

            <span>
              {system.assignedEmployeesCount}{" "}
              עובדים משויכים
            </span>

            <small>
              {system.managementNote ?? ""}
            </small>
          </div>
        </div>

        {showBudget && (
          <div className="dashboard-kpi-system-budget">
            {hasBudget ? (
              <>
                <div>
                  <span>תקציב:</span>

                  <strong>
                    {system.allocatedBudget.toLocaleString(
                      "he-IL"
                    )}{" "}
                    ₪
                  </strong>
                </div>

                <div>
                  <span>
                    {system.budgetGap < 0
                      ? "חריגה:"
                      : "יתרה:"}
                  </span>

                  <strong>
                    {Math.abs(
                      system.budgetGap
                    ).toLocaleString(
                      "he-IL"
                    )}{" "}
                    ₪
                  </strong>
                </div>
              </>
            ) : (
              <div>
                <span>
                  תקציב לא הוגדר
                </span>
              </div>
            )}
          </div>
        )}

        <div className="employee-card-divider" />

        <div className="employee-card-metrics dashboard-kpi-system-metrics">
          <div>
            <span>נדרש</span>

            <strong>
              {
                system.requiredCapacityMonths
              }
            </strong>
          </div>

          <div>
            <span>מוקצה</span>

            <strong>
              {system.allocatedMonths}
            </strong>
          </div>

          <div>
            <span>פער</span>

            <strong
              className={
                tone === "shortage"
                  ? "overloaded"
                  : tone === "excess"
                    ? "excess"
                    : "balanced"
              }
            >
              {Math.abs(system.gap)}
            </strong>
          </div>

          <div>
            <span>עובדים</span>

            <strong>
              {
                system.assignedEmployeesCount
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-system-footer">
        <div className="employee-card-divider dashboard-kpi-system-footer-divider" />

        <div
          className={[
            "dashboard-kpi-system-actions",
            hasShortage
              ? "dashboard-kpi-system-actions--three"
              : "dashboard-kpi-system-actions--two"
          ].join(" ")}
        >
          {hasShortage && (
            <button
              type="button"
              className="dashboard-kpi-system-action"
              onClick={(event) => {
                event.stopPropagation();
                onAssign(system);
              }}
            >
              שיבוץ עובדים
            </button>
          )}

          <button
            type="button"
            className="dashboard-kpi-system-action"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(system);
            }}
          >
            עריכת מערכת
          </button>

          <button
            type="button"
            className="dashboard-kpi-system-action"
            onClick={(event) => {
              event.stopPropagation();
              onOpenProfile(system);
            }}
          >
            פתיחת פרופיל
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DashboardKpiDetailsModal({
  open,
  mode,
  systems,
  onClose,
  onAssign,
  onEdit,
  onOpenProfile
}: DashboardKpiDetailsModalProps) {
  const [search, setSearch] =
    useState("");

  const config = getConfig(mode);
  const isBudgetMode =
    mode === "budget";

  const visibleSystems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return [...systems]
      .filter(
        (system) =>
          !normalizedSearch ||
          system.name
            .toLowerCase()
            .includes(normalizedSearch)
      )
      .sort(
        (
          firstSystem,
          secondSystem
        ) => {
          if (isBudgetMode) {
            return (
              firstSystem.budgetGap -
              secondSystem.budgetGap
            );
          }

          return (
            secondSystem.gap -
            firstSystem.gap
          );
        }
      );
  }, [
    systems,
    search,
    isBudgetMode
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay dashboard-kpi-modal-overlay"
      onClick={onClose}
    >
      <section
        className={[
          "modal-card",
          "dashboard-kpi-modal-card",
          isBudgetMode
            ? "dashboard-kpi-modal-card--budget"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        dir="rtl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close-btn dashboard-kpi-modal-close"
          onClick={onClose}
          aria-label="סגירת חלון"
        >
          ×
        </button>

        <header className="dashboard-kpi-modal-header">
          <div>
            <h2>{config.title}</h2>

            <p>
              {config.description}
            </p>
          </div>

          <span className="dashboard-kpi-modal-count">
            {visibleSystems.length} מערכות
          </span>
        </header>

        <div className="dashboard-kpi-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="חיפוש מערכת..."
            aria-label="חיפוש מערכת"
          />
        </div>

        <div
          className={[
            "dashboard-kpi-list",
            isBudgetMode
              ? "dashboard-kpi-list--budget"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {visibleSystems.map(
            (system) => (
              <DashboardKpiSystemCard
                key={system.id}
                system={system}
                showBudget={
                  config.showBudget
                }
                onAssign={onAssign}
                onEdit={onEdit}
                onOpenProfile={
                  onOpenProfile
                }
              />
            )
          )}

          {visibleSystems.length ===
            0 && (
            <div className="empty-text">
              אין מערכות להצגה.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}