
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSystems } from "../hooks/useSystems";
import type { System } from "../types";
import SystemCard from "../components/Systems/SystemCard";
import { getSystemCardTone } from "../components/Systems/SystemCard";
import SystemProfile from "../components/Systems/SystemProfile";
import SystemGroup from "../components/Systems/SystemGroup";
import AssignEmployeesDrawer from "../components/Systems/AssignEmployeesDrawer";
import CreateSystemModal from "../components/Systems/CreateSystemModal";
import EditSystemModal from "../components/Systems/EditSystemModal";
import UnifiedToolbar from "../components/shared/UnifiedToolbar";
import "./SystemsPage.css";
import PageTabs from "../components/PageTabs";

type ViewMode = "all" | "status" | "gap";
type UiStatus = "all" | "shortage" | "balanced" | "excess";

// מחזיר את השנה הפעילה כברירת מחדל לפילטרים.
function getActiveYear() {
  return new Date().getFullYear();
}

// ממפה מערכת לגוון סטטוס חזותי לפי פער הקיבולת.
function getSystemTone(system: System): "shortage" | "balanced" | "excess" {
  if (system.gap > 0) return "shortage";
  if (system.gap < 0) return "excess";
  return "balanced";
}

// מסנן מערכת לפי סטטוס UI נבחר.
function matchesStatus(system: System, status: UiStatus) {
  if (status === "all") return true;
  return getSystemTone(system) === status;
}

// מבצע חיפוש טקסטואלי חופשי על שדות רלוונטיים במערכת.
function matchesSearch(system: System, search: string) {
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

// מקבץ מערכות לפי מצב עסקי (עודף/מאוזן/מחסור).
function getStatusGroups(systems: System[]) {
  return {
    excess: systems.filter((system) => system.gap < 0),
    balanced: systems.filter((system) => system.gap === 0),
    shortage: systems.filter((system) => system.gap > 0)
  };
}

// מקבץ מערכות לפי חומרת פער הקיבולת.
function getGapGroups(systems: System[]) {
  return {
    healthy: systems.filter((system) => system.gap <= 0),
    regularShortage: systems.filter((system) => system.gap > 0 && system.gap <= 4),
    criticalShortage: systems.filter((system) => system.gap > 4)
  };
}

// עמוד מערכות: מצבי תצוגה, פילטרים, פרופיל מערכת וניהול פעולות.
export default function SystemsPage() {
  const activeYear = getActiveYear();
  const yearOptions = [activeYear - 1, activeYear, activeYear + 1];

  const [searchParams] = useSearchParams();
  const riskFilter = searchParams.get("risk");
  const systemIdFromUrl = searchParams.get("systemId");
  const requestedView = searchParams.get("view");
  const requestedStatus = searchParams.get("status");
  const requestedSearch = searchParams.get("search");

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [uiStatus, setUiStatus] = useState<UiStatus>("all");
  const [localSearch, setLocalSearch] = useState("");
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const {
    systems,
    selectedSystem,
    loadingList,
    loadingDetails,
    error,
    filters,
    setFilters,
    loadSystems,
    loadSystemDetails,
    setSelectedSystem
  } = useSystems();

  // טוען מערכת ספציפית אם הועבר מזהה ב-URL.
  useEffect(() => {
  if (!systemIdFromUrl) return;

  void loadSystemDetails(systemIdFromUrl);
}, [systemIdFromUrl, loadSystemDetails]);

  useEffect(() => {
    if (requestedView === "all" || requestedView === "status" || requestedView === "gap") {
      setViewMode(requestedView);
    }

    if (requestedStatus === "all" || requestedStatus === "shortage" || requestedStatus === "balanced" || requestedStatus === "excess") {
      setUiStatus(requestedStatus);
    }

    if (requestedSearch) {
      setLocalSearch(requestedSearch);
    }
  }, [requestedView, requestedStatus, requestedSearch]);

  const visibleSystems = useMemo(() => {
    let result = systems;

    if (riskFilter === "at-risk") result = result.filter((system) => system.gap > 4);
    if (riskFilter === "shortage") result = result.filter((system) => system.gap > 0);
    if (riskFilter === "balanced") result = result.filter((system) => system.gap <= 0);

    result = result.filter((system) => matchesStatus(system, uiStatus));
    result = result.filter((system) => matchesSearch(system, localSearch));

    return result;
  }, [systems, riskFilter, uiStatus, localSearch]);

  const statusGroups = useMemo(() => getStatusGroups(visibleSystems), [visibleSystems]);
  const gapGroups = useMemo(() => getGapGroups(visibleSystems), [visibleSystems]);

  const summaryCounts = useMemo(() => {
    const tones = visibleSystems.map(getSystemCardTone);

    return {
      green: tones.filter((tone) => tone === "excess").length,
      balanced: tones.filter((tone) => tone === "balanced").length,
      red: tones.filter((tone) => tone === "shortage").length
    };
  }, [visibleSystems]);

  // מבצע גלילה אוטומטית לאזור פרופיל המערכת הנבחרת.
  useEffect(() => {
    if (!selectedSystem) return;

    requestAnimationFrame(() => {
      profileRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }, [selectedSystem?.id]);

  // מאפס את כלל הפילטרים והחיפוש המקומי.
  function clearFilters() {
    setFilters({});
    setUiStatus("all");
    setLocalSearch("");
  }

  // מרענן נתונים לאחר שיוך עובדים למערכת.
  async function refreshAfterAssignment() {
    if (selectedSystem) {
      await loadSystemDetails(selectedSystem.id);
    }

    await loadSystems();
  }

  // מרענן רשימה לאחר יצירת מערכת חדשה.
  async function refreshAfterCreate() {
    await loadSystems();
  }

  // מרענן פרופיל ורשימה לאחר עדכון מערכת.
  async function refreshAfterEdit() {
    if (!selectedSystem) return;

    await loadSystemDetails(selectedSystem.id);
    await loadSystems();
  }

  return (
    <main className="systems-page-shell" dir="rtl">
      <PageTabs />

      <UnifiedToolbar
        filters={(
          <>
          <label>
            סינון
            <select
                value={filters.year ?? activeYear}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  year: Number(event.target.value)
                }))
              }
            >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
            </select>
          </label>

          <label>
            מנהל
            <select
              value={filters.ownerManagerName ?? ""}
              disabled
              title="הסינון יהיה זמין בהמשך"
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  ownerManagerName: event.target.value || undefined
                }))
              }
            >
              <option value="">כל המנהלים</option>
            </select>
          </label>

          <label>
            סטטוס
            <select
              value={uiStatus}
              onChange={(event) => setUiStatus(event.target.value as UiStatus)}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="shortage">מחסור</option>
              <option value="balanced">מאוזן</option>
              <option value="excess">עודף</option>
            </select>
          </label>

          <label className="systems-search-label">
            חיפוש
            <input
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="חיפוש מערכת לפי שם או תחום בעייתי"
            />
          </label>

          <button type="button" className="secondary-btn unified-clean-btn" onClick={clearFilters}>
            ניקוי
          </button>
          </>
        )}
        summary={(
          <>
            {summaryCounts.red > 0 && <span className="unified-stat-pill danger">חוסר: {summaryCounts.red}</span>}
            {summaryCounts.green > 0 && <span className="unified-stat-pill green">זמין: {summaryCounts.green}</span>}
            {summaryCounts.balanced > 0 && <span className="unified-stat-pill neutral">מאוזן: {summaryCounts.balanced}</span>}
          </>
        )}
        grouping={(
          <>
            <button
              type="button"
              className={`unified-view-pill ${viewMode === "all" ? "active" : ""}`}
              onClick={() => setViewMode("all")}
            >
              כל המערכות
            </button>

            <button
              type="button"
              className={`unified-view-pill ${viewMode === "status" ? "active" : ""}`}
              onClick={() => setViewMode("status")}
            >
              קיבוץ לפי מצב
            </button>

            <button
              type="button"
              className={`unified-view-pill ${viewMode === "gap" ? "active" : ""}`}
              onClick={() => setViewMode("gap")}
            >
              קיבוץ לפי פער קיבולת
            </button>
          </>
        )}
        actionButton={(
          <button
            type="button"
            className="primary-btn"
            onClick={() => setCreateModalOpen(true)}
          >
            + הוספת מערכת
          </button>
        )}
      />

    

      {selectedSystem && (
        <div ref={profileRef} className="systems-profile-board">
          <SystemProfile
            system={selectedSystem}
            loading={loadingDetails}
            onBack={() => {
              setEditModalOpen(false);
              setAssignDrawerOpen(false);
              setSelectedSystem(null);
            }}
            onOpenAssign={() => setAssignDrawerOpen(true)}
            onOpenEdit={() => setEditModalOpen(true)}
          />
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <section className="systems-board">
        <header className="systems-board-header">
          <div>
            <h2>כל המערכות</h2>
            <p>{visibleSystems.length} מערכות מוצגות כעת</p>
          </div>

          <span className="shortage-counter">
            {summaryCounts.red} במחסור
          </span>
        </header>

        {loadingList && <div className="system-note-box">טוען מערכות...</div>}

        {!loadingList && viewMode === "all" && (
          <div className="systems-cards-grid">
            {visibleSystems.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                selected={selectedSystem?.id === system.id}
                onClick={() => loadSystemDetails(system.id)}
              />
            ))}
          </div>
        )}

        {!loadingList && viewMode === "status" && (
          <div className="systems-groups-stack">
            <SystemGroup
              title="עודף"
              subtitle="מערכות עם יותר קיבולת מוקצית מהנדרש."
              tone="excess"
              systems={statusGroups.excess}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />

            <SystemGroup
              title="מאוזן"
              subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
              tone="balanced"
              systems={statusGroups.balanced}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />

            <SystemGroup
              title="מחסור"
              subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
              tone="shortage"
              systems={statusGroups.shortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />
          </div>
        )}

        {!loadingList && viewMode === "gap" && (
          <div className="systems-groups-stack">
            <SystemGroup
              title="מאוזן או עודף קיבולת"
              subtitle="מערכות שאינן דורשות תגבור כרגע."
              tone="excess"
              systems={gapGroups.healthy}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />

            <SystemGroup
              title="מחסור רגיל"
              subtitle="פער קיבולת קטן יחסית, עד 4 חודשי עבודה."
              tone="balanced"
              systems={gapGroups.regularShortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />

            <SystemGroup
              title="פער קריטי מעל 4 חודשים"
              subtitle="מערכות עם מחסור משמעותי שדורש תשומת לב ניהולית."
              tone="shortage"
              systems={gapGroups.criticalShortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
              selectedSystemId={selectedSystem?.id ?? null}
            />
          </div>
        )}

        {!loadingList && visibleSystems.length === 0 && (
          <div className="empty-text">לא נמצאו מערכות להצגה.</div>
        )}
      </section>

      <CreateSystemModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={refreshAfterCreate}
      />
      <AssignEmployeesDrawer
        open={assignDrawerOpen}
        system={selectedSystem}
        year={filters.year ?? activeYear}
        onClose={() => setAssignDrawerOpen(false)}
        onAssigned={refreshAfterAssignment}
      />

      <EditSystemModal
        open={editModalOpen}
        system={selectedSystem}
        onClose={() => setEditModalOpen(false)}
        onUpdated={refreshAfterEdit}
      />
    </main>
  );
}
