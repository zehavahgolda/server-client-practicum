import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";

import { useOrganizationEvents } from "../../../hooks/useOrganizationEvents";
import { organizationEventService } from "../../../services/organizationEventService";
import { systemService } from "../../../services/systemService";

import type {
  OrganizationEvent,
  OrganizationEventScopeType,
  OrganizationEventStatus,
  System
} from "../../../types";

import OrganizationEventDeactivateDialog from "./OrganizationEventDeactivateDialog";
import OrganizationEventFormModal from "./OrganizationEventFormModal";

interface OrganizationEventsSectionProps {
  onReturnHome: () => void;
}

function getStatusLabel(status: OrganizationEventStatus) {
  if (status === "Active") {
    return "פעיל";
  }

  if (status === "Future") {
    return "עתידי";
  }

  return "הסתיים";
}

function getScopeLabel(scopeType: OrganizationEventScopeType) {
  return scopeType === "AllOrganization" ? "כלל־ארגוני" : "מערכות נבחרות";
}

function formatDateDisplay(value?: string | null): string {
  if (!value) {
    return "";
  }

  const key = value.trim().slice(0, 10);
  const [year, month, day] = key.split("-");
  return `${day}.${month}.${year}`;
}

function formatRange(startDate: string, endDate?: string | null): string {
  const start = formatDateDisplay(startDate);
  const end = formatDateDisplay(endDate);

  return end ? `${start}–${end}` : `${start} ואילך`;
}

export default function OrganizationEventsSection({
  onReturnHome
}: OrganizationEventsSectionProps) {
  const {
    organizationEvents,
    loading,
    error,
    reloadOrganizationEvents
  } = useOrganizationEvents();

  const [systems, setSystems] = useState<System[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScopeType, setSelectedScopeType] = useState<"" | OrganizationEventScopeType>("");
  const [selectedStatus, setSelectedStatus] = useState<"" | OrganizationEventStatus>("");
  const [showCompletedHistory, setShowCompletedHistory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] = useState<OrganizationEvent | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<OrganizationEvent | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  useEffect(() => {
    void reloadOrganizationEvents({
      search: searchTerm.trim() || undefined,
      scopeType: selectedScopeType || undefined,
      status: selectedStatus || undefined
    });
  }, [reloadOrganizationEvents, searchTerm, selectedScopeType, selectedStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadSystems() {
      setSystemsLoading(true);
      setSystemsError(null);

      try {
        const rows = await systemService.getSystems();
        if (cancelled) {
          return;
        }

        setSystems(rows.filter((system) => system.isActive !== false && system.name?.trim()));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setSystemsError(err instanceof Error ? err.message : "שגיאה בטעינת מערכות");
      } finally {
        if (!cancelled) {
          setSystemsLoading(false);
        }
      }
    }

    void loadSystems();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeOrUpcomingEvents = useMemo(
    () => organizationEvents.filter((event) => event.status !== "Completed"),
    [organizationEvents]
  );

  const completedEvents = useMemo(
    () => organizationEvents.filter((event) => event.status === "Completed"),
    [organizationEvents]
  );

  const hasError = Boolean(error || systemsError);
  const combinedError = error || systemsError;
  const isLoading = loading || systemsLoading;
  const hasFilters = Boolean(searchTerm.trim() || selectedScopeType || selectedStatus);
  const showDefaultEmpty = !isLoading && !hasError && organizationEvents.length === 0 && !hasFilters;
  const showFilteredEmpty = !isLoading && !hasError && organizationEvents.length === 0 && hasFilters;

  function toHebrewOrganizationEventError(err: unknown): string {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("Title is required")) {
      return "יש להזין כותרת";
    }

    if (message.includes("StartDate is required")) {
      return "יש לבחור תאריך התחלה";
    }

    if (message.includes("EndDate cannot be earlier")) {
      return "תאריך סיום לא יכול להיות מוקדם מתאריך התחלה";
    }

    if (message.includes("At least one target system is required")) {
      return "יש לבחור לפחות מערכת אחת";
    }

    if (message.includes("target systems") || message.includes("System was not found") || message.includes("ObjectId")) {
      return "אחת או יותר מהמערכות שנבחרו אינן תקינות או שאינן פעילות";
    }

    return "אירעה שגיאה בשמירת האירוע";
  }

  function openCreateModal() {
    setSelectedEvent(null);
    setModalMode("create");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(event: OrganizationEvent) {
    setSelectedEvent(event);
    setModalMode("edit");
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(payload: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    scopeType: OrganizationEventScopeType;
    targetSystemIds: string[];
  }) {
    setFormSaving(true);
    setFormError(null);

    try {
      if (modalMode === "create") {
        await organizationEventService.createOrganizationEvent(payload);
      } else if (selectedEvent) {
        await organizationEventService.updateOrganizationEvent(selectedEvent.id, payload);
      }

      await reloadOrganizationEvents({
        search: searchTerm.trim() || undefined,
        scopeType: selectedScopeType || undefined,
        status: selectedStatus || undefined
      });

      setModalOpen(false);
    } catch (err) {
      setFormError(toHebrewOrganizationEventError(err));
      throw err;
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) {
      return;
    }

    setDeactivateSaving(true);

    try {
      await organizationEventService.deleteOrganizationEvent(deactivateTarget.id);
      await reloadOrganizationEvents({
        search: searchTerm.trim() || undefined,
        scopeType: selectedScopeType || undefined,
        status: selectedStatus || undefined
      });
      setDeactivateTarget(null);
    } finally {
      setDeactivateSaving(false);
    }
  }

  return (
    <section className="panel management-section-shell">
      <div className="management-section-topline">
        <div className="management-section-heading">
          <h2>אירועים כלל־ארגוניים</h2>
          <p>ניהול אירועים רוחביים והיסטוריית אירועים ארגוניים</p>
        </div>

        <button type="button" className="management-return-home" onClick={onReturnHome}>
          חזרה למסכי ניהול
        </button>
      </div>

      <div className="management-reserved-toolbar management-org-events-toolbar">
        <label className="management-reserved-field" htmlFor="organization-events-search">
          חיפוש אירוע
        </label>

        <div className="management-search-input-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            id="organization-events-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="חיפוש לפי כותרת או פירוט"
          />
        </div>

        <label className="management-reserved-field management-org-events-filter">
          היקף האירוע
          <select value={selectedScopeType} onChange={(event) => setSelectedScopeType(event.target.value as "" | OrganizationEventScopeType)}>
            <option value="">כל ההיקפים</option>
            <option value="AllOrganization">כל הארגון</option>
            <option value="SelectedSystems">מערכות נבחרות</option>
          </select>
        </label>

        <label className="management-reserved-field management-org-events-filter">
          סטטוס
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "" | OrganizationEventStatus)}>
            <option value="">כל הסטטוסים</option>
            <option value="Active">פעיל</option>
            <option value="Future">עתידי</option>
            <option value="Completed">הסתיים</option>
          </select>
        </label>

        <button type="button" className="primary-btn" onClick={openCreateModal} disabled={systemsLoading || systems.length === 0}>
          <Plus size={16} aria-hidden="true" />
          הוספת אירוע
        </button>
      </div>

      {isLoading ? (
        <div className="management-inline-state" role="status" aria-live="polite">
          טוען אירועים כלל־ארגוניים...
        </div>
      ) : null}

      {combinedError ? <div className="management-error-box">{combinedError}</div> : null}

      {showDefaultEmpty ? (
        <div className="management-empty-state">
          <div className="management-empty-state-icon" aria-hidden="true">
            <Search size={22} />
          </div>
          <p>אין אירועים כלל־ארגוניים להצגה</p>
          <small>ניתן להתחיל בלחיצה על הוספת אירוע</small>
        </div>
      ) : null}

      {showFilteredEmpty ? (
        <div className="management-empty-state">
          <div className="management-empty-state-icon" aria-hidden="true">
            <Search size={22} />
          </div>
          <p>לא נמצאו אירועים התואמים לסינון</p>
          <small>אפשר לנסות חיפוש או מסננים אחרים</small>
        </div>
      ) : null}

      {!isLoading && !hasError && activeOrUpcomingEvents.length > 0 ? (
        <div className="management-org-events-list" role="list" aria-label="אירועים כלל־ארגוניים פעילים ועתידיים">
          {activeOrUpcomingEvents.map((event) => (
            <div key={event.id} className="management-org-events-row" role="listitem">
              <div className="management-org-events-main">
                <div className="management-org-events-title-row">
                  <div className="management-org-events-name">{event.title}</div>
                  <span className={`management-org-events-status management-org-events-status--${event.status.toLowerCase()}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>

                <div className="management-org-events-meta">
                  <span>{formatRange(event.startDate, event.endDate)}</span>
                  <span>{getScopeLabel(event.scopeType)}</span>
                </div>

                {event.description?.trim() ? (
                  <div className="management-org-events-description">{event.description.trim()}</div>
                ) : null}

                {event.scopeType === "SelectedSystems" && event.targetSystems.length > 0 ? (
                  <div className="management-org-events-systems">
                    {event.targetSystems.map((system) => system.name).join(" ,")}
                  </div>
                ) : null}
              </div>

              <div className="management-org-events-actions">
                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => openEditModal(event)}
                  title="עריכה"
                  aria-label={`עריכת ${event.title}`}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => setDeactivateTarget(event)}
                  title="השבתה"
                  aria-label={`השבתת ${event.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !hasError && completedEvents.length > 0 ? (
        <section className="management-org-events-history">
          <button
            type="button"
            className="management-history-toggle"
            onClick={() => setShowCompletedHistory((current) => !current)}
          >
            <span>{showCompletedHistory ? "הסתרת היסטוריית אירועים" : "הצגת היסטוריית אירועים"}</span>
          </button>

          {showCompletedHistory ? (
            <div className="management-org-events-list" role="list" aria-label="היסטוריית אירועים כלל־ארגוניים">
              {completedEvents.map((event) => (
                <div key={event.id} className="management-org-events-row management-org-events-row--completed" role="listitem">
                  <div className="management-org-events-main">
                    <div className="management-org-events-title-row">
                      <div className="management-org-events-name">{event.title}</div>
                      <span className="management-org-events-status management-org-events-status--completed">
                        {getStatusLabel(event.status)}
                      </span>
                    </div>

                    <div className="management-org-events-meta">
                      <span>{formatRange(event.startDate, event.endDate)}</span>
                      <span>{getScopeLabel(event.scopeType)}</span>
                    </div>

                    {event.description?.trim() ? (
                      <div className="management-org-events-description">{event.description.trim()}</div>
                    ) : null}

                    {event.scopeType === "SelectedSystems" && event.targetSystems.length > 0 ? (
                      <div className="management-org-events-systems">
                        {event.targetSystems.map((system) => system.name).join(" ,")}
                      </div>
                    ) : null}
                  </div>

                  <div className="management-org-events-actions">
                    <button
                      type="button"
                      className="management-icon-btn"
                      onClick={() => openEditModal(event)}
                      title="עריכה"
                      aria-label={`עריכת ${event.title}`}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      className="management-icon-btn"
                      onClick={() => setDeactivateTarget(event)}
                      title="השבתה"
                      aria-label={`השבתת ${event.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <OrganizationEventFormModal
        open={modalOpen}
        mode={modalMode}
        systems={systems}
        initialValue={selectedEvent ? {
          title: selectedEvent.title,
          description: selectedEvent.description,
          startDate: selectedEvent.startDate.slice(0, 10),
          endDate: selectedEvent.endDate?.slice(0, 10) ?? null,
          scopeType: selectedEvent.scopeType,
          targetSystemIds: selectedEvent.targetSystemIds
        } : undefined}
        saving={formSaving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <OrganizationEventDeactivateDialog
        open={Boolean(deactivateTarget)}
        saving={deactivateSaving}
        title={deactivateTarget?.title ?? ""}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </section>
  );
}