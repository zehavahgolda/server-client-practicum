import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  UsersRound,
  WalletCards
} from "lucide-react";

import { employeeEventTypeOptions } from "../../../constants/employeeEventTypes";
import { employeeEventService } from "../../../services/employeeEventService";
import { systemService } from "../../../services/systemService";
import type { EmployeeEvent, SystemDetails, SystemOrganizationEvent } from "../../../types";
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

  return `כ־${totalMonths.toFixed(1)} חודשים`;
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

function getEventToneClass(event: EmployeeEvent, todayKey: string): "info" | "amber" | "muted" {
  const bucket = getEventBucket(event, todayKey);
  if (bucket === 2) {
    return "muted";
  }

  const amberTypes = new Set([
    "ReserveDuty",
    "ParentalLeave",
    "SpecialLeave",
    "AvailabilityChange"
  ]);

  if (amberTypes.has(event.eventType)) {
    return "amber";
  }

  return "info";
}

function getOrganizationEventBucket(event: SystemOrganizationEvent, todayKey: string): 0 | 1 | 2 {
  const start = toDateKey(event.startDate);
  const end = toDateKey(event.endDate);

  if (!start) {
    return 2;
  }

  if (end && end < todayKey) {
    return 2;
  }

  if (start > todayKey) {
    return 1;
  }

  return 0;
}

function getOrganizationEventToneClass(event: SystemOrganizationEvent, todayKey: string): "info" | "amber" | "muted" {
  const bucket = getOrganizationEventBucket(event, todayKey);

  if (bucket === 2) {
    return "muted";
  }

  return "info";
}

function getOrganizationEventScopeLabel(event: SystemOrganizationEvent): string {
  return event.scopeType === "AllOrganization" ? "כלל־ארגוני" : "מערכות נבחרות";
}

export default function SystemProfile({
  system,
  loading = false,
  onBack,
  onOpenAssign,
  onOpenEdit
}: SystemProfileProps) {
  const navigate = useNavigate();

  const [localManagementNote, setLocalManagementNote] = useState(
    system.managementNote?.trim() || ""
  );

  const [noteDraft, setNoteDraft] = useState(localManagementNote);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const noteEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const managementPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nextNote = system.managementNote?.trim() || "";
    setLocalManagementNote(nextNote);
    setNoteDraft(nextNote);
    setNoteEditing(false);
    setNoteError(null);
  }, [system.managementNote, system.id]);

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

  const hasEventData = availabilityItems.length > 0;
  const organizationEventItems = useMemo(() => system.organizationEvents || [], [system.organizationEvents]);
  const splitOrganizationEventItems = useMemo(() => {
    const currentOrFuture: SystemOrganizationEvent[] = [];
    const historical: SystemOrganizationEvent[] = [];

    for (const event of organizationEventItems) {
      const bucket = getOrganizationEventBucket(event, todayKey);
      if (bucket === 2) {
        historical.push(event);
      } else {
        currentOrFuture.push(event);
      }
    }

    return { currentOrFuture, historical };
  }, [organizationEventItems, todayKey]);
  const [showOrganizationHistory, setShowOrganizationHistory] = useState(false);
  const hasOrganizationEventData = organizationEventItems.length > 0;
  const hasAnyManagementContent = Boolean(localManagementNote) || hasEventData || hasOrganizationEventData;
  const visibleHistoricalItems = showFullHistory
    ? splitAvailabilityItems.historical
    : splitAvailabilityItems.historical.slice(0, 4);
  const hasMoreHistoricalItems = splitAvailabilityItems.historical.length > 4;

  useEffect(() => {
    if (!noteEditing) {
      return;
    }

    noteEditorRef.current?.focus();
  }, [noteEditing]);

  function openNoteEditor() {
    setNoteEditing(true);
    setNoteError(null);
    managementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSaveNote() {
    const nextNote = noteDraft.trim();

    if (nextNote === localManagementNote) {
      setNoteEditing(false);
      setNoteError(null);
      return;
    }

    setNoteSaving(true);
    setNoteError(null);

    try {
      await systemService.updateSystem(system.id, {
        name: system.name,
        requiredCapacityMonths: system.requiredCapacityMonths,
        allocatedBudget: system.allocatedBudget,
        managementNote: nextNote || undefined
      });

      setLocalManagementNote(nextNote);
      setNoteEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "שמירת הערת המערכת נכשלה.";
      setNoteError(message);
    } finally {
      setNoteSaving(false);
    }
  }

  function handleCancelNoteEdit() {
    setNoteDraft(localManagementNote);
    setNoteEditing(false);
    setNoteError(null);
  }

  function renderAvailabilityItems(items: AvailabilityListItem[]) {
    return items.map((item) => {
      const event = item.event;
      const duration = getApproxDurationLabel(event.startDate, event.endDate);
      const description = event.description?.trim();
      const toneClass = getEventToneClass(event, todayKey);

      return (
        <article className="management-stream-item timeline-item" key={item.key}>
          <div className="management-item-content">
            <p className="management-item-title-row">
              <span className="management-item-title">{item.fullName}</span>
              <span className={`management-item-marker ${toneClass}`} aria-hidden="true" />
            </p>
            <p className="management-item-label">{getEventTypeLabel(event)}</p>

            <p className="management-item-meta">
              {formatRange(event.startDate, event.endDate)}
              {duration ? ` · ${duration}` : ""}
            </p>

            {description && <p className="management-item-description">{description}</p>}
          </div>
        </article>
      );
    });
  }

  function renderOrganizationEventItems(items: SystemOrganizationEvent[]) {
    return items.map((event) => {
      const toneClass = getOrganizationEventToneClass(event, todayKey);
      const description = event.description?.trim();

      return (
        <article className="management-stream-item timeline-item" key={event.id}>
          <div className="management-item-content">
            <p className="management-item-title-row">
              <span className="management-item-title">{event.title}</span>
              <span className={`management-item-marker ${toneClass}`} aria-hidden="true" />
            </p>

            <p className="management-item-meta">
              {formatRange(event.startDate, event.endDate)}
              <span className="system-profile-org-event-scope">{getOrganizationEventScopeLabel(event)}</span>
            </p>

            {description ? <p className="management-item-description">{description}</p> : null}
          </div>
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
                  <span className="system-profile-meta-separator" aria-hidden="true">•</span>
                  עודף קיבולת: <strong>{Math.abs(system.gap)}</strong>
                </p>
              </div>
            </div>

            <div className="system-profile-actions">
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

          {localManagementNote && (
            <div className="system-note-box enhanced-note-box">
              <span className="system-note-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="10" x2="12" y2="16" />
                  <circle cx="12" cy="7" r="1" />
                </svg>
              </span>
              <span className="system-note-text">{localManagementNote}</span>
              <button
                type="button"
                className="note-edit-btn note-edit-btn--banner"
                onClick={openNoteEditor}
                aria-label="עריכת הערת מערכת"
                title="עריכת הערת מערכת"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
                  <path d="M14.06 4.19l3.75 3.75" />
                </svg>
              </button>
            </div>
          )}

          <section className="system-profile-kpis">
            <div className="system-profile-kpi">
              <div className="system-profile-kpi-layout">
                <div className="system-profile-kpi-copy">
                  <span>חודשי אדם נדרשים</span>
                  <strong>{system.requiredCapacityMonths}</strong>
                </div>

                <span className="system-profile-kpi-icon" aria-hidden="true">
                  <ClipboardList size={23} strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="system-profile-kpi">
              <div className="system-profile-kpi-layout">
                <div className="system-profile-kpi-copy">
                  <span>חודשי אדם מוקצים</span>
                  <strong>{system.allocatedMonths}</strong>
                </div>

                <span className="system-profile-kpi-icon" aria-hidden="true">
                  <WalletCards size={23} strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="system-profile-kpi">
              <div className="system-profile-kpi-layout">
                <div className="system-profile-kpi-copy">
                  <span>{system.gap > 0 ? "מחסור" : system.gap < 0 ? "עודף" : "פער"}</span>
                  <strong className={tone}>{Math.abs(system.gap)}</strong>
                </div>

                <span className="system-profile-kpi-icon" aria-hidden="true">
                  <AlertTriangle size={23} strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="system-profile-kpi">
              <div className="system-profile-kpi-layout">
                <div className="system-profile-kpi-copy">
                  <span>עובדים משוייכים</span>
                  <strong>{system.assignedEmployeesCount}</strong>
                </div>

                <span className="system-profile-kpi-icon" aria-hidden="true">
                  <UsersRound size={23} strokeWidth={2} />
                </span>
              </div>
            </div>
          </section>

          <section className="system-budget-panel">
            <div className="system-budget-header">
              <h2>תמונת מצב תקציבית</h2>
            </div>

            <div className="system-budget-unified" dir="rtl">
              <div className="system-budget-cell system-budget-value-cell">
                <span>הוקצה</span>
                <strong>{formatCurrency(system.allocatedBudget)}</strong>
              </div>

              <div className="system-budget-cell system-budget-value-cell">
                <span>שימוש בפועל</span>
                <strong>{formatCurrency(system.usedBudget)}</strong>
              </div>

              <div className="system-budget-cell system-budget-value-cell">
                <span>{system.budgetGap < 0 ? "חריגה" : "יתרה"}</span>
                <strong className={budgetTone}>{formatCurrency(Math.abs(system.budgetGap))}</strong>
              </div>

              <div className="system-budget-cell system-budget-progress-cell">
                <div className="system-budget-progress-label">
                  <span>ניצול תקציב</span>
                  <strong>{budgetUsagePercent}%</strong>
                </div>

                <span className={`system-budget-status ${budgetTone}`}>
                  {system.budgetGap < 0 ? "חריגה תקציבית" : "תקציב תקין"}
                </span>

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
                        <p className="assigned-employee-name-row">
                          <span>{employee.fullName}</span>
                          {activeEmployeeIds.has(employee.employeeId) && (
                            <span
                              className="assigned-employee-active-indicator"
                              title="שינוי זמינות פעיל"
                              aria-label="שינוי זמינות פעיל"
                            />
                          )}
                        </p>

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

            <section className="system-profile-panel insight-panel" ref={managementPanelRef}>
              <div className="system-profile-panel-header">
                <div>
                  <h2>מידע ניהולי</h2>
                  <p>הערות, אירועים ושינויים המשפיעים על המערכת</p>
                </div>
              </div>

              <div className="management-stream-scroll">
                {localManagementNote && (
                  <section className="management-stream-group">
                    <div className="management-note-head">
                      <h3>הערת מערכת פעילה</h3>

                      {!noteEditing && (
                        <button
                          type="button"
                          className="note-edit-btn"
                          onClick={openNoteEditor}
                          aria-label="עריכת הערת מערכת"
                          title="עריכת הערת מערכת"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
                            <path d="M14.06 4.19l3.75 3.75" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {!noteEditing && (
                      <article className="management-stream-item note-item">
                        <div className="management-item-content">
                          <p className="management-item-title-row">
                            <span className="management-item-description">{localManagementNote}</span>
                            <span className="management-item-marker note" aria-hidden="true" />
                          </p>
                        </div>
                      </article>
                    )}

                    {noteEditing && (
                      <div className="note-editor-box">
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          className="note-editor-input"
                          rows={4}
                          disabled={noteSaving}
                          ref={noteEditorRef}
                        />

                        {noteError && <p className="system-management-error">{noteError}</p>}

                        <div className="note-editor-actions">
                          <button
                            type="button"
                            className="small-outline-btn"
                            onClick={handleCancelNoteEdit}
                            disabled={noteSaving}
                          >
                            ביטול
                          </button>

                          <button
                            type="button"
                            className="small-solid-btn"
                            onClick={() => void handleSaveNote()}
                            disabled={noteSaving}
                          >
                            {noteSaving ? "שומר..." : "שמירה"}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {!eventsLoading && !eventsError && splitAvailabilityItems.currentOrFuture.length > 0 && (
                  <section className="management-stream-group">
                    <h3>
                      כעת ובקרוב
                      <small>{availabilityEmployeesCount} עובדים מושפעים</small>
                    </h3>

                    <div className="management-stream-list">
                      {renderAvailabilityItems(splitAvailabilityItems.currentOrFuture)}
                    </div>
                  </section>
                )}

                {!eventsLoading && !eventsError && splitAvailabilityItems.historical.length > 0 && (
                  <section className="management-stream-group">
                    <h3>אירועים קודמים</h3>

                    <div className="management-stream-list">
                      {renderAvailabilityItems(visibleHistoricalItems)}
                    </div>

                    {hasMoreHistoricalItems && (
                      <button
                        type="button"
                        className="management-history-toggle"
                        onClick={() => setShowFullHistory((prev) => !prev)}
                      >
                        <span>{showFullHistory ? "הסתרת היסטוריה" : "הצגת היסטוריה מלאה"}</span>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                          className={showFullHistory ? "expanded" : ""}
                        >
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </button>
                    )}
                  </section>
                )}

                {!eventsLoading && !eventsError && hasOrganizationEventData && (
                  <section className="management-stream-group">
                    <h3>אירועים כלל־משרדיים</h3>

                    {splitOrganizationEventItems.currentOrFuture.length > 0 ? (
                      <div className="management-stream-list">
                        {renderOrganizationEventItems(splitOrganizationEventItems.currentOrFuture)}
                      </div>
                    ) : null}

                    {splitOrganizationEventItems.historical.length > 0 ? (
                      <>
                        <button
                          type="button"
                          className="management-history-toggle"
                          onClick={() => setShowOrganizationHistory((current) => !current)}
                        >
                          <span>{showOrganizationHistory ? "הסתרת היסטוריית אירועים" : "הצגת היסטוריית אירועים"}</span>
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                            className={showOrganizationHistory ? "expanded" : ""}
                          >
                            <polyline points="9 6 15 12 9 18" />
                          </svg>
                        </button>

                        {showOrganizationHistory ? (
                          <div className="management-stream-list">
                            {renderOrganizationEventItems(splitOrganizationEventItems.historical)}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </section>
                )}

                {eventsLoading && <p className="empty-text">טוען שינויי זמינות...</p>}

                {!eventsLoading && eventsError && (
                  <p className="system-management-error">{eventsError}</p>
                )}

                {!eventsLoading && !eventsError && !hasAnyManagementContent && (
                  <p className="empty-text">אין כרגע אירועים או הערות המשפיעים על המערכת.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
