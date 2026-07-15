import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeEventTypeOptions } from "../../../constants/employeeEventTypes";
import EmployeeEventFormModal from "../events/EmployeeEventFormModal";
import { useEmployeeEvents } from "../../../hooks/useEmployeeEvents";
import type {
  EmployeeDetails,
  EmployeeEvent,
  EmployeeEventCreatePayload
} from "../../../types";
import "./EmployeeProfile.css";

// מאפייני קומפוננטת פרופיל עובד.
interface Props {
  employee: EmployeeDetails;
}

// קובע טון תצוגה לפי יתרת קיבולת העובד.
function getAvailabilityTone(employee: EmployeeDetails) {
  if (employee.remainingMonths < 0) return "overloaded";
  if (employee.remainingMonths === 0) return "balanced";
  return "available";
}

// מחזיר תווית סטטוס זמינות קריאה למשתמש.
function getAvailabilityLabel(employee: EmployeeDetails) {
  if (employee.remainingMonths < 0) return "עומס יתר";
  if (employee.remainingMonths === 0) return "זמינות מלאה";
  return "זמינות תקינה";
}

// מחלץ אות ראשונה לשימוש באווטאר העובד.
function getEmployeeInitial(name: string) {
  return name.trim().charAt(0) || "ע";
}

function toDateKey(dateValue?: string | null): string | null {
  if (!dateValue) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  return null;
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHebrewDate(dateValue?: string | null) {
  const safeDate = toDateKey(dateValue);
  if (!safeDate) return "";

  const [year, month, day] = safeDate.split("-");
  return `${day}.${month}.${year}`;
}

function getEventTypeLabel(event: EmployeeEvent) {
  const normalizedType = event.eventType?.trim() ?? "";
  const option = employeeEventTypeOptions.find(
    (item) => item.value === normalizedType
  );

  if (normalizedType === "Other" && event.customEventType?.trim()) {
    return event.customEventType.trim();
  }

  return option?.label || normalizedType || "אירוע";
}

function formatEventPeriod(event: EmployeeEvent) {
  const start = toDateKey(event.startDate);
  const end = toDateKey(event.endDate);

  if (!start) {
    return "";
  }

  if (!end) {
    return `החל מ־${formatHebrewDate(start)}`;
  }

  if (start === end) {
    return formatHebrewDate(start);
  }

  return `${formatHebrewDate(start)}-${formatHebrewDate(end)}`;
}

function getEventSummarySentence(event: EmployeeEvent, mode: "current" | "future") {
  const label = getEventTypeLabel(event);
  const start = toDateKey(event.startDate);
  const end = toDateKey(event.endDate);

  if (!start) {
    return label;
  }

  const currentTypePhrases: Record<string, string> = {
    ReserveDuty: "במילואים",
    ParentalLeave: "בחופשת לידה",
    SpecialLeave: "בחופשה",
    ExtendedAbsence: "בהיעדרות ממושכת",
    AvailabilityChange: "בשינוי זמינות"
  };

  const futureTypePhrases: Record<string, string> = {
    ReserveDuty: "למילואים",
    ParentalLeave: "לחופשת לידה",
    SpecialLeave: "לחופשה",
    ExtendedAbsence: "להיעדרות ממושכת",
    AvailabilityChange: "לשינוי זמינות"
  };

  const currentPhrase = currentTypePhrases[event.eventType] || `ב${label}`;
  const futurePhrase = futureTypePhrases[event.eventType] || `ל${label}`;

  if (mode === "current") {
    if (!end) {
      return `העובד נמצא כעת ${currentPhrase} החל מ־${formatHebrewDate(start)}`;
    }

    if (start === end) {
      return `העובד נמצא כעת ${currentPhrase} ב־${formatHebrewDate(start)}`;
    }

    return `העובד נמצא כעת ${currentPhrase} עד ${formatHebrewDate(end)}`;
  }

  if (!end) {
    return `העובד צפוי לצאת ${futurePhrase} החל מ־${formatHebrewDate(start)}`;
  }

  if (start === end) {
    return `העובד צפוי לצאת ${futurePhrase} ב־${formatHebrewDate(start)}`;
  }

  return `העובד צפוי לצאת ${futurePhrase} החל מ־${formatHebrewDate(start)}`;
}

// מציג מסך פרופיל עובד מלא עם מדדים, שיבוצים ותמונת ניהול.
export default function EmployeeProfile({ employee }: Props) {
  const navigate = useNavigate();
  const tone = getAvailabilityTone(employee);
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEmployeeEvents(employee.id);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EmployeeEvent | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const todayKey = getTodayDateKey();

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const startA = toDateKey(a.startDate) || "";
        const startB = toDateKey(b.startDate) || "";

        if (startA !== startB) {
          return startB.localeCompare(startA);
        }

        return (b.id || "").localeCompare(a.id || "");
      }),
    [events]
  );

  const currentEvent = useMemo(() => {
    const currentEvents = sortedEvents.filter((event) => {
      const start = toDateKey(event.startDate);
      const end = toDateKey(event.endDate);

      return Boolean(start && start <= todayKey && (!end || end >= todayKey));
    });

    return currentEvents[0] ?? null;
  }, [sortedEvents, todayKey]);

  const nearestFutureEvent = useMemo(() => {
    const futureEvents = sortedEvents
      .filter((event) => {
        const start = toDateKey(event.startDate);
        return Boolean(start && start > todayKey);
      })
      .sort((a, b) => {
        const startA = toDateKey(a.startDate) || "";
        const startB = toDateKey(b.startDate) || "";
        return startA.localeCompare(startB);
      });

    return futureEvents[0] ?? null;
  }, [sortedEvents, todayKey]);

  const bannerMode = currentEvent ? "current" : nearestFutureEvent ? "future" : null;
  const bannerEvent = currentEvent ?? nearestFutureEvent;

  const showQuietEmptyState =
    !currentEvent && !nearestFutureEvent && !eventsLoading;

  function openCreateEventModal() {
    setSelectedEvent(null);
    setActionError(null);
    setEventModalOpen(true);
  }

  function openEditEventModal(event: EmployeeEvent) {
    setSelectedEvent(event);
    setActionError(null);
    setEventModalOpen(true);
  }

  function closeEventModal() {
    if (savingEvent) {
      return;
    }

    setEventModalOpen(false);
    setSelectedEvent(null);
  }

  async function handleSubmitEvent(payload: EmployeeEventCreatePayload) {
    if (savingEvent) {
      return;
    }

    setSavingEvent(true);
    setActionError(null);

    try {
      if (selectedEvent?.id) {
        await updateEvent(selectedEvent.id, payload);
      } else {
        await createEvent(payload);
      }

      setEventModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "שמירת האירוע נכשלה. נסה שוב.";
      setActionError(message);
      throw err;
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (savingEvent || deletingEventId) {
      return;
    }

    const shouldDelete = window.confirm("למחוק את האירוע מרשימת הזמינות?");
    if (!shouldDelete) {
      return;
    }

    setDeletingEventId(eventId);
    setActionError(null);

    try {
      await deleteEvent(eventId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "מחיקת האירוע נכשלה. נסה שוב.";
      setActionError(message);
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <article className="employee-profile-card" dir="rtl">
      <header className="employee-profile-hero">
        <div className="employee-profile-avatar">
          {getEmployeeInitial(employee.fullName)}
        </div>

        <div className="employee-profile-title-block">
          <span className="employee-profile-kicker">סביבת ניהול עובד</span>
          <h2>{employee.fullName}</h2>

          <p>
            {employee.professionalCategory}
            {employee.professionalSubCategory ? ` | ${employee.professionalSubCategory}` : ""}
            {" | "}
            מנהל: {employee.managerName}
          </p>

          <div className="employee-profile-tags">
            <span className={`employee-profile-status ${tone}`}>
              {getAvailabilityLabel(employee)}
            </span>
          </div>
        </div>
      </header>

      <div className={`employee-profile-note ${tone}`}>
        {bannerEvent && bannerMode
          ? getEventSummarySentence(bannerEvent, bannerMode)
          : employee.remainingMonths < 0
            ? "העובד בעומס יתר ודורש איזון שיבוצים מיידי."
            : employee.remainingMonths === 0
              ? "העובד מנוצל באופן מלא, אין קיבולת פנויה נוספת."
              : "העובד זמין יחסית ויכול לשמש כיעד לאיזון עומסים."}
      </div>

      <section className="employee-profile-metrics">
        <div className="employee-profile-metric">
          <span>קיבולת שנתית</span>
          <strong>{employee.yearlyCapacityMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>מנוצל</span>
          <strong>{employee.allocatedMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>יתרה</span>
          <strong className={tone}>{employee.remainingMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>מערכות פעילות</span>
          <strong>{employee.assignedSystemsCount}</strong>
        </div>
      </section>

      <section className="employee-profile-content-grid">
        <div className="employee-profile-panel employee-assignments-panel">
          {/* רשימת שיבוצים פעילים וקישור מהיר למערכת משויכת */}
          <h3>שיבוצים פעילים</h3>

          <div className="employee-profile-allocations">
            {employee.allocations.length === 0 && (
              <div className="employee-profile-empty">
                אין שיבוצים פעילים לעובד זה.
              </div>
            )}

            {employee.allocations.map((allocation) => (
              <div
                key={`${allocation.systemId}-${allocation.roleInSystem}`}
                className="employee-profile-allocation"
              >
                <div>
                  <strong>{allocation.systemName}</strong>
                  <span>{allocation.actualMonths} חודשי עבודה מתוכננים</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/systems?systemId=${allocation.systemId}`)}
                >
                  פתיחת מערכת
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="employee-profile-panel manager-panel employee-availability-panel">
          <h3>אירועים עתידיים וזמינות</h3>

          <div className="employee-profile-events-actions">
            <button
              type="button"
              className="employee-profile-icon-btn"
              onClick={openCreateEventModal}
              disabled={savingEvent || Boolean(deletingEventId)}
              title="הוספת אירוע"
              aria-label="הוספת אירוע"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="8" y1="3" x2="8" y2="7" />
                <line x1="16" y1="3" x2="16" y2="7" />
                <line x1="12" y1="12" x2="12" y2="18" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </button>
          </div>

          {actionError && <div className="error-box">{actionError}</div>}
          {eventsError && <div className="error-box">{eventsError}</div>}

          {eventsLoading && (
            <div className="employee-profile-empty">טוען אירועי זמינות...</div>
          )}

          {!eventsLoading && currentEvent && (
            <div className="employee-profile-change">
              <strong>{getEventTypeLabel(currentEvent)}</strong>
              <span>{formatEventPeriod(currentEvent)}</span>
              {currentEvent.description?.trim() && <span>{currentEvent.description.trim()}</span>}
            </div>
          )}

          {!eventsLoading && !currentEvent && nearestFutureEvent && (
            <div className="employee-profile-change">
              <strong>{getEventTypeLabel(nearestFutureEvent)}</strong>
              <span>{formatEventPeriod(nearestFutureEvent)}</span>
              {nearestFutureEvent.description?.trim() && (
                <span>{nearestFutureEvent.description.trim()}</span>
              )}
            </div>
          )}

          {showQuietEmptyState && (
            <div className="employee-profile-empty">
              אין שינויי זמינות קרובים.
            </div>
          )}

          {sortedEvents.length > 0 && (
            <>
              <button
                type="button"
                className="employee-profile-history-toggle"
                onClick={() => setHistoryOpen((prev) => !prev)}
              >
                {historyOpen ? "הסתרת היסטוריית זמינות" : "הצגת היסטוריית זמינות"} ({events.length})
              </button>

              {historyOpen && (
                <div className="employee-profile-events-history" role="region" aria-label="היסטוריית זמינות">
                  {sortedEvents.map((event) => (
                    <div key={event.id} className="employee-profile-event-item">
                      <div className="employee-profile-event-item-main">
                        <strong>{getEventTypeLabel(event)}</strong>
                        <span>{formatEventPeriod(event)}</span>
                        {event.description?.trim() && (
                          <span>{event.description.trim()}</span>
                        )}
                      </div>

                      <div className="employee-profile-event-item-actions">
                        <button
                          type="button"
                          className="employee-profile-icon-btn"
                          onClick={() => openEditEventModal(event)}
                          disabled={savingEvent || Boolean(deletingEventId)}
                          title="עריכת אירוע"
                          aria-label="עריכת אירוע"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
                            <path d="M14.06 4.19l3.75 3.75" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="employee-profile-icon-btn"
                          onClick={() => void handleDeleteEvent(event.id)}
                          disabled={savingEvent || deletingEventId === event.id}
                          title="מחיקת אירוע"
                          aria-label="מחיקת אירוע"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <line x1="10" y1="10" x2="10" y2="17" />
                            <line x1="14" y1="10" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </section>

      <EmployeeEventFormModal
        open={eventModalOpen}
        employeeId={employee.id}
        event={selectedEvent}
        saving={savingEvent}
        onClose={closeEventModal}
        onSubmit={handleSubmitEvent}
      />
    </article>
  );
}
