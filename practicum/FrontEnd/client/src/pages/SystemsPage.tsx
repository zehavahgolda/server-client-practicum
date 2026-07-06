
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSystems } from "../hooks/useSystems";
import { categoryService } from "../services/categoryService";
import type { Category, System } from "../types";
import SystemCard from "../components/Systems/SystemCard";
import SystemProfile from "../components/Systems/SystemProfile";
import SystemGroup from "../components/Systems/SystemGroup";
import AssignEmployeesDrawer from "../components/Systems/AssignEmployeesDrawer";
import CreateSystemModal from "../components/Systems/CreateSystemModal";
import EditSystemModal from "../components/Systems/EditSystemModal";
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

// מחשב כמה מערכות נמצאות במחסור.
function getShortageCount(systems: System[]) {
  return systems.filter((system) => system.gap > 0).length;
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

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [uiStatus, setUiStatus] = useState<UiStatus>("all");
  const [localSearch, setLocalSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
        setCategories([]);
      }
    }

    void loadCategories();
  }, []);

  // טוען מערכת ספציפית אם הועבר מזהה ב-URL.
  useEffect(() => {
  if (!systemIdFromUrl) return;

  void loadSystemDetails(systemIdFromUrl);
}, [systemIdFromUrl, loadSystemDetails]);

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

  // מצב פרופיל: מוצג כאשר נבחרה מערכת ספציפית.
  if (selectedSystem) {
    return (
      <main className="systems-page-shell" dir="rtl">
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

  return (
    <main className="systems-page-shell" dir="rtl">
      <PageTabs />

      <section className="systems-toolbar-card">
        <div className="systems-filter-row">
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
            קטגוריה
            <select
              value={filters.categoryName ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryName: event.target.value || undefined
                }))
              }
            >
              <option value="">כל הקטגוריות</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
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

          <button type="button" className="secondary-btn clean-btn" onClick={clearFilters}>
            ניקוי
          </button>
        </div>

        <div className="systems-toolbar-divider" />

        <div className="systems-actions-row">
          <span>פעולות</span>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setCreateModalOpen(true)}
          >
            + הוספת מערכת
          </button>
        </div>

        <div className="systems-view-row">
          <span>תצוגה</span>

          <button
            type="button"
            className={`view-pill ${viewMode === "all" ? "active" : ""}`}
            onClick={() => setViewMode("all")}
          >
            כל המערכות
          </button>

          <button
            type="button"
            className={`view-pill ${viewMode === "status" ? "active" : ""}`}
            onClick={() => setViewMode("status")}
          >
            קיבוץ לפי מצב
          </button>

          <button
            type="button"
            className={`view-pill ${viewMode === "gap" ? "active" : ""}`}
            onClick={() => setViewMode("gap")}
          >
            קיבוץ לפי פער קיבולת
          </button>
        </div>
      </section>

      <section className="systems-overview-title">
        <h1>מבט מערכות</h1>
        <p>סקירת כל המערכות, קיבוץ לפי מצב עסקי או פער קיבולת, וכניסה לפרופיל מערכת.</p>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="systems-board">
        <header className="systems-board-header">
          <div>
            <h2>כל המערכות</h2>
            <p>{visibleSystems.length} מערכות מוצגות כעת</p>
          </div>

          <span className="shortage-counter">
            {getShortageCount(visibleSystems)} במחסור
          </span>
        </header>

        {loadingList && <div className="system-note-box">טוען מערכות...</div>}

        {!loadingList && viewMode === "all" && (
          <div className="systems-cards-grid">
            {visibleSystems.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                selected={false}
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
            />

            <SystemGroup
              title="מאוזן"
              subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
              tone="balanced"
              systems={statusGroups.balanced}
              // defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="מחסור"
              subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
              tone="shortage"
              systems={statusGroups.shortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
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
            />

            <SystemGroup
              title="מחסור רגיל"
              subtitle="פער קיבולת קטן יחסית, עד 4 חודשי עבודה."
              tone="balanced"
              systems={gapGroups.regularShortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="פער קריטי מעל 4 חודשים"
              subtitle="מערכות עם מחסור משמעותי שדורש תשומת לב ניהולית."
              tone="shortage"
              systems={gapGroups.criticalShortage}
              // defaultOpen
              onSystemClick={loadSystemDetails}
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
    </main>
  );
}
