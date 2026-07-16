import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { employeeEventTypeOptions } from "../../../constants/employeeEventTypes";
import { employeeEventService } from "../../../services/employeeEventService";
import type { EmployeeEvent, SystemDetails } from "../../../types";
import { formatCurrency } from "../../../utils/numberFormatters";

import "./SystemProfile.css";

interface SystemProfileProps {
  system: SystemDetails;
  loading?: boolean;
  onBack: () => void;
  onOpenAssign: () => void;
  onOpenEdit: () => void;
}

type SystemTone = "shortage" | "excess" | "balanced";

type EmployeeWithEvents = {
  employeeId: string;
  fullName: string;
  events: EmployeeEvent[];
};

type AvailabilityListItem = {
  key: string;
  employeeId: string;
  fullName: string;
  event: EmployeeEvent;
};

function getTone(gap: number): SystemTone {
  if (gap > 0) return "shortage";
  if (gap < 0) return "excess";
  return "balanced";
}

function getStatusLabel(gap: number) {
  if (gap > 0) return "במחסור";
  if (gap < 0) return "בעודף";
  return "מאוזנת";
}

function getBudgetUsagePercent(system: SystemDetails) {
  if (!system.allocatedBudget || system.allocatedBudget <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((system.usedBudget / system.allocatedBudget) * 100)
  );
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDateKey(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  return normalized.slice(0, 10);
}

function formatDateDisplay(value?: string | null): string {
  const key = toDateKey(value);
  if (!key) return "";

  const [year, month, day] = key.split("-");
  return `${day}.${month}.${year}`;
}

function formatRange(startDate: string, endDate?: string | null): string {
  const start = formatDateDisplay(startDate);
  const end = formatDateDisplay(endDate);
  return end ? `${start}–${end}` : `${start} ואילך`;
}

function getApproxDurationLabel(startDate: string, endDate?: string | null): string | null {
  const start = toDateKey(startDate);
  const end = toDateKey(endDate);

  if (!start || !end || end < start) {
    return null;
  }

  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);

  const totalMonths =
    (endYear - startYear) * 12 +
    (endMonth - startMonth) +
    (endDay - startDay) / 30;

  if (!Number.isFinite(totalMonths) || totalMonths <= 0) {
    return null;
  }

  return `משך משוער: כ־${totalMonths.toFixed(1)} חודשים`;
}

function getEventTypeLabel(event: EmployeeEvent): string {
  const normalizedType = event.eventType?.trim() ?? "";
  const option = employeeEventTypeOptions.find((item) => item.value === normalizedType);

  if (normalizedType === "Other" && event.customEventType?.trim()) {
    return event.customEventType.trim();
  }

  return option?.label || normalizedType || "אירוע";
}

function getEventBucket(event: EmployeeEvent, todayKey: string): 0 | 1 | 2 {
  const start = toDateKey(event.startDate);
  const end = toDateKey(event.endDate);

  if (!start) {
    return 2;
  }

  const isCurrent = start <= todayKey && (!end || end >= todayKey);
  if (isCurrent) return 0;

  if (start > todayKey) return 1;

  return 2;
}

export default function SystemProfile({
  system,
  loading = false,
  onBack,
  onOpenAssign,
  onOpenEdit
}: SystemProfileProps) {
  const navigate = useNavigate();

  const [employeesAvailabilityOpen, setEmployeesAvailabilityOpen] = useState(true);
  const [orgEventsOpen, setOrgEventsOpen] = useState(false);
  const [systemHistoryOpen, setSystemHistoryOpen] = useState(false);

  const managementNote = system.managementNote?.trim() || "";
  const todayKey = getTodayKey();

  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsByEmployeeId, setEventsByEmployeeId] = useState<Record<string, EmployeeEvent[]>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadBatchEvents() {
      const employeeIds = Array.from(
        new Set(
          (system.assignedEmployees || [])
            .map((employee) => employee.employeeId?.trim())
            .filter((employeeId): employeeId is string => Boolean(employeeId))
        )
      );

      if (employeeIds.length === 0) {
        setEventsByEmployeeId({});
        setEventsError(null);
        setEventsLoading(false);
        return;
      }

      setEventsLoading(true);
      setEventsError(null);

      try {
        const items = await employeeEventService.getEmployeeEventsBatch(employeeIds);
        if (cancelled) return;

        const nextMap: Record<string, EmployeeEvent[]> = {};
        for (const item of items) {
          nextMap[item.employeeId] = item.events || [];
        }

        setEventsByEmployeeId(nextMap);
      } catch {
        if (cancelled) return;
        setEventsError("טעינת שינויי הזמינות נכשלה.");
        setEventsByEmployeeId({});
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    }

    void loadBatchEvents();

    return () => {
      cancelled = true;
    };
  }, [system.id, system.assignedEmployees]);

  const employeesWithEvents = useMemo<EmployeeWithEvents[]>(() => {
    const result: EmployeeWithEvents[] = [];

    for (const employee of system.assignedEmployees || []) {
      const events = eventsByEmployeeId[employee.employeeId] || [];
      if (events.length === 0) continue;

      const sortedEvents = [...events].sort((a, b) => {
        const bucketDiff = getEventBucket(a, todayKey) - getEventBucket(b, todayKey);
        if (bucketDiff !== 0) return bucketDiff;

        if (getEventBucket(a, todayKey) === 2) {
          const aStart = toDateKey(a.startDate) || "";
          const bStart = toDateKey(b.startDate) || "";
          return bStart.localeCompare(aStart);
        }

        const aStart = toDateKey(a.startDate) || "";
        const bStart = toDateKey(b.startDate) || "";
        return aStart.localeCompare(bStart);
      });

      result.push({
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        events: sortedEvents
      });
    }

    return result;
  }, [eventsByEmployeeId, system.assignedEmployees, todayKey]);

  const availabilityEmployeesCount = employeesWithEvents.length;

  const availabilityItems = useMemo<AvailabilityListItem[]>(() => {
    const items: AvailabilityListItem[] = [];

    for (const employee of employeesWithEvents) {
      for (const event of employee.events) {
        items.push({
          key: `${employee.employeeId}-${event.id}`,
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          event
        });
      }
    }

    return items;
  }, [employeesWithEvents]);

  const splitAvailabilityItems = useMemo(() => {
    const currentOrFuture: AvailabilityListItem[] = [];
    const historical: AvailabilityListItem[] = [];

    for (const item of availabilityItems) {
      const bucket = getEventBucket(item.event, todayKey);
      if (bucket === 2) {
        historical.push(item);
      } else {
        currentOrFuture.push(item);
      }
    }

    return { currentOrFuture, historical };
  }, [availabilityItems, todayKey]);

  const activeEmployeeIds = useMemo(() => {
    const ids = new Set<string>();

    for (const employee of system.assignedEmployees || []) {
      const events = eventsByEmployeeId[employee.employeeId] || [];
      const hasCurrentEvent = events.some((event) => getEventBucket(event, todayKey) === 0);
      if (hasCurrentEvent) {
        ids.add(employee.employeeId);
      }
    }

    return ids;
  }, [eventsByEmployeeId, system.assignedEmployees, todayKey]);

  const tone = getTone(system.gap);
  const statusLabel = getStatusLabel(system.gap);
  const firstLetter = system.name?.trim().charAt(0) || "מ";

  const budgetUsagePercent = getBudgetUsagePercent(system);
  const budgetTone = system.budgetGap < 0 ? "shortage" : "balanced";

  const shouldShowGroupedList =
    splitAvailabilityItems.currentOrFuture.length > 0 &&
    splitAvailabilityItems.historical.length > 0 &&
    availabilityItems.length >= 5;

  function renderAvailabilityItems(items: AvailabilityListItem[]) {
    return items.map((item) => {
      const event = item.event;
      const duration = getApproxDurationLabel(event.startDate, event.endDate);
      const description = event.description?.trim();

      return (
        <article className="availability-timeline-item" key={item.key}>
          <p className="availability-item-name">{item.fullName}</p>

          <p className="availability-item-meta">
            {getEventTypeLabel(event)} · {formatRange(event.startDate, event.endDate)}
          </p>

          {duration && <p className="availability-item-duration">{duration}</p>}

          {description && <p className="availability-item-description">{description}</p>}
        </article>
      );
    });
  }

  return (
    <div className="modal-overlay system-profile-modal-overlay" onClick={onBack}>
      <div className="modal-card system-profile-modal-card" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onBack}
          aria-label="סגירת פרופיל מערכת"
        >
          ×
        </button>

        <section className="system-profile-page" dir="rtl">
          <header className="system-profile-header">
            <div className="system-profile-heading">
              <div className="system-profile-avatar">{firstLetter}</div>

              <div className="system-profile-title-area">
                <span className="system-profile-eyebrow">סביבת ניהול מערכת</span>

                <div className="system-profile-title-row">
                  <h1>{system.name}</h1>

                  <span className={`system-status-pill ${tone}`}>{statusLabel}</span>
                </div>

                <p>
                  {system.assignedEmployeesCount} עובדים משויכים
                  <span className="system-profile-meta-separator" aria-hidden="true">
                    •
                  </span>
                  פער קיבולת: <strong>{Math.abs(system.gap)}</strong>
                </p>
              </div>
            </div>

            <div className="system-profile-actions">
              <button
                type="button"
                className="secondary-btn system-profile-action"
                onClick={onBack}
              >
                חזרה לרשימה
              </button>

              <button
                type="button"
                className="primary-btn system-profile-action"
                onClick={onOpenEdit}
              >
                עריכת מערכת
              </button>

              <button
                type="button"
                className="secondary-btn system-profile-action"
                onClick={onOpenAssign}
              >
                + שיבוץ עובדים
              </button>
            </div>
          </header>

          {loading && <div className="system-note-box">טוען פרטי מערכת...</div>}

          {managementNote && <div className="system-note-box">{managementNote}</div>}

          <section className="system-profile-kpis">
            <div className="system-profile-kpi">
              <span>קיבולת נדרשת</span>
              <strong>{system.requiredCapacityMonths}</strong>
            </div>

            <div className="system-profile-kpi">
              <span>קיבולת מוקצית</span>
              <strong>{system.allocatedMonths}</strong>
            </div>

            <div className="system-profile-kpi">
              <span>{system.gap > 0 ? "מחסור" : system.gap < 0 ? "עודף" : "פער"}</span>
              <strong className={tone}>{Math.abs(system.gap)}</strong>
            </div>

            <div className="system-profile-kpi">
              <span>עובדים משויכים</span>
              <strong>{system.assignedEmployeesCount}</strong>
            </div>
          </section>

          <section className="system-budget-panel">
            <div className="system-budget-header">
              <div>
                <h2>תמונת מצב תקציבית</h2>
                <p>תקציב מוקצה, שימוש בפועל ויתרה נוכחית.</p>
              </div>

              <span className={`system-budget-status ${budgetTone}`}>
                {system.budgetGap < 0 ? "חריגה תקציבית" : "תקציב תקין"}
              </span>
            </div>

            <div className="system-budget-content">
              <div className="system-budget-kpis">
                <div className="system-budget-kpi">
                  <span>הוקצה</span>
                  <strong>{formatCurrency(system.allocatedBudget)}</strong>
                </div>

                <div className="system-budget-kpi">
                  <span>שימוש בפועל</span>
                  <strong>{formatCurrency(system.usedBudget)}</strong>
                </div>

                <div className="system-budget-kpi">
                  <span>{system.budgetGap < 0 ? "חריגה" : "יתרה"}</span>
                  <strong className={budgetTone}>{formatCurrency(Math.abs(system.budgetGap))}</strong>
                </div>
              </div>

              <div className="system-budget-progress">
                <div className="system-budget-progress-label">
                  <span>ניצול תקציב</span>
                  <strong>{budgetUsagePercent}%</strong>
                </div>

                <div className="system-budget-track">
                  <div
                    className={`system-budget-fill ${budgetTone}`}
                    style={{ width: `${budgetUsagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="system-profile-content">
            <section className="system-profile-panel employees-panel">
              <div className="system-profile-panel-header">
                <div>
                  <h2>הקצאות עובדים</h2>
                  <p>העובדים המשויכים למערכת והקצאת חודשי העבודה שלהם.</p>
                </div>

                <span className="system-profile-panel-count">{system.assignedEmployees.length}</span>
              </div>

              {system.assignedEmployees.length === 0 ? (
                <p className="empty-text">אין עובדים משויכים למערכת זו.</p>
              ) : (
                <div className="assigned-employees-list">
                  {system.assignedEmployees.map((employee) => (
                    <div className="assigned-employee-row" key={employee.employeeId}>
                      <div className="assigned-employee-details">
                        <strong className="assigned-employee-name-row">
                          <span>{employee.fullName}</span>
                          {activeEmployeeIds.has(employee.employeeId) && (
                            <span
                              className="assigned-employee-active-indicator"
                              title="שינוי זמינות פעיל"
                              aria-label="שינוי זמינות פעיל"
                            >
                              ⏱
                            </span>
                          )}
                        </strong>

                        <span>
                          {employee.actualMonths} חודשי עבודה | {employee.professionalCategory}
                          {employee.professionalSubCategory ? ` | ${employee.professionalSubCategory}` : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="small-outline-btn"
                        onClick={() => navigate(`/employees?employeeId=${employee.employeeId}`)}
                      >
                        פתיחת עובד
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="system-profile-panel insight-panel">
              <div className="system-profile-panel-header">
                <div>
                  <h2>תמונת ניהול</h2>
                  <p>הקשר ניהולי משלים עבור זמינות ושינויים ברמת המערכת.</p>
                </div>
              </div>

              <div className="system-management-section">
                {eventsLoading && <p className="empty-text">טוען שינויי זמינות...</p>}

                {!eventsLoading && eventsError && (
                  <p className="system-management-error">{eventsError}</p>
                )}

                {!eventsLoading && !eventsError && (
                  <>
                    {availabilityItems.length === 0 ? (
                      <p className="empty-text">לא נמצאו שינויי זמינות לעובדים המשויכים.</p>
                    ) : (
                      <div className="system-collapsible-row-group">
                        <button
                          type="button"
                          className="system-collapsible-header"
                          onClick={() => setEmployeesAvailabilityOpen((prev) => !prev)}
                          aria-expanded={employeesAvailabilityOpen}
                        >
                          <span className="system-collapsible-title">
                            שינויים בזמינות עובדים
                            <small>{availabilityEmployeesCount} עובדים מושפעים</small>
                          </span>
                          <span className="system-collapsible-chevron">
                            {employeesAvailabilityOpen ? "▾" : "▸"}
                          </span>
                        </button>

                        {employeesAvailabilityOpen && (
                          <div className="system-collapsible-body availability-list-scroll">
                            {shouldShowGroupedList ? (
                              <>
                                {splitAvailabilityItems.currentOrFuture.length > 0 && (
                                  <section className="availability-group">
                                    <h3 className="availability-group-title">כעת ובקרוב</h3>
                                    <div className="availability-timeline-list">
                                      {renderAvailabilityItems(splitAvailabilityItems.currentOrFuture)}
                                    </div>
                                  </section>
                                )}

                                {splitAvailabilityItems.historical.length > 0 && (
                                  <section className="availability-group">
                                    <h3 className="availability-group-title">אירועים קודמים</h3>
                                    <div className="availability-timeline-list">
                                      {renderAvailabilityItems(splitAvailabilityItems.historical)}
                                    </div>
                                  </section>
                                )}
                              </>
                            ) : (
                              <div className="availability-timeline-list">
                                {renderAvailabilityItems(availabilityItems)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="system-management-section">
                <button
                  type="button"
                  className="system-collapsible-header secondary"
                  onClick={() => setOrgEventsOpen((prev) => !prev)}
                  aria-expanded={orgEventsOpen}
                >
                  <span className="system-collapsible-title">אירועים כלל־משרדיים</span>
                  <span className="system-collapsible-chevron">{orgEventsOpen ? "▾" : "▸"}</span>
                </button>
              </div>

              <div className="system-management-section">
                <button
                  type="button"
                  className="system-collapsible-header secondary"
                  onClick={() => setSystemHistoryOpen((prev) => !prev)}
                  aria-expanded={systemHistoryOpen}
                >
                  <span className="system-collapsible-title">היסטוריית מערכת</span>
                  <span className="system-collapsible-chevron">{systemHistoryOpen ? "▾" : "▸"}</span>
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
