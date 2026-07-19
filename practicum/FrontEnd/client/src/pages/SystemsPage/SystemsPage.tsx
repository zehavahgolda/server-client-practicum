import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useSearchParams } from "react-router-dom";

import { useSystems } from "../../hooks/useSystems";
import {
  getGapGroups,
  getStatusGroups,
  matchesSearch,
  matchesStatus,
  type UiStatus
} from "../../utils/systemViewUtils";
import {
  buildYearOptions,
  getActiveYear
} from "../../utils/yearOptions";

import SystemCard, {
  getSystemCardTone
} from "../../components/Systems/cards/SystemCard";
import SystemProfile from "../../components/Systems/profile/SystemProfile";
import SystemGroup from "../../components/Systems/groups/SystemGroup";
import AssignEmployeesDrawer from "../../components/Systems/drawers/AssignEmployeesDrawer";
import CreateSystemModal from "../../components/Systems/modals/CreateSystemModal";
import EditSystemModal from "../../components/Systems/modals/EditSystemModal";

import UnifiedToolbar from "../../components/shared/navigation/UnifiedToolbar";

import "./SystemsPage.css";

type ViewMode = "all" | "status" | "gap";

// עמוד מערכות: מצבי תצוגה, פילטרים, פרופיל מערכת וניהול פעולות.
export default function SystemsPage() {
  const activeYear = getActiveYear();

  const yearOptions = useMemo(
    () => buildYearOptions(activeYear),
    [activeYear]
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const riskFilter =
    searchParams.get("risk");

  const systemIdFromUrl =
    searchParams.get("systemId");

  const requestedView =
    searchParams.get("view");

  const requestedStatus =
    searchParams.get("status");

  const requestedSearch =
    searchParams.get("search");

  const [viewMode, setViewMode] =
    useState<ViewMode>("all");

  const [uiStatus, setUiStatus] =
    useState<UiStatus>("all");

  const [localSearch, setLocalSearch] =
    useState("");

  const [
    assignDrawerOpen,
    setAssignDrawerOpen
  ] = useState(false);

  const [
    createModalOpen,
    setCreateModalOpen
  ] = useState(false);

  const [
    editModalOpen,
    setEditModalOpen
  ] = useState(false);

  const profileRef =
    useRef<HTMLDivElement | null>(null);

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
    if (!systemIdFromUrl) {
      return;
    }

    void loadSystemDetails(systemIdFromUrl);
  }, [
    systemIdFromUrl,
    loadSystemDetails
  ]);

  // מסנכרן תצוגה, סטטוס וחיפוש שמגיעים מה-URL.
  useEffect(() => {
    if (
      requestedView === "all" ||
      requestedView === "status" ||
      requestedView === "gap"
    ) {
      setViewMode(requestedView);
    }

    if (
      requestedStatus === "all" ||
      requestedStatus === "shortage" ||
      requestedStatus === "balanced" ||
      requestedStatus === "excess"
    ) {
      setUiStatus(requestedStatus);
    }

    if (requestedSearch) {
      setLocalSearch(requestedSearch);
    }
  }, [
    requestedView,
    requestedStatus,
    requestedSearch
  ]);

  const visibleSystems = useMemo(() => {
    let result = systems;

    if (riskFilter === "at-risk") {
      result = result.filter(
        (system) => system.gap > 4
      );
    }

    if (riskFilter === "shortage") {
      result = result.filter(
        (system) => system.gap > 0
      );
    }

    if (riskFilter === "balanced") {
      result = result.filter(
        (system) => system.gap <= 0
      );
    }

    result = result.filter(
      (system) =>
        matchesStatus(system, uiStatus)
    );

    result = result.filter(
      (system) =>
        matchesSearch(system, localSearch)
    );

    return result;
  }, [
    systems,
    riskFilter,
    uiStatus,
    localSearch
  ]);

  const statusGroups = useMemo(
    () => getStatusGroups(visibleSystems),
    [visibleSystems]
  );

  const gapGroups = useMemo(
    () => getGapGroups(visibleSystems),
    [visibleSystems]
  );

  const summaryCounts = useMemo(() => {
    const tones =
      visibleSystems.map(getSystemCardTone);

    return {
      green: tones.filter(
        (tone) => tone === "excess"
      ).length,

      balanced: tones.filter(
        (tone) => tone === "balanced"
      ).length,

      red: tones.filter(
        (tone) => tone === "shortage"
      ).length
    };
  }, [visibleSystems]);

  // מבצע גלילה אוטומטית לאזור פרופיל המערכת הנבחרת.
  useEffect(() => {
    if (!selectedSystem) {
      return;
    }

    requestAnimationFrame(() => {
      profileRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }, [selectedSystem?.id]);

  // מסיר רק את סינוני הסטטוס שהגיעו מהדשבורד.
  // פילטרים ידניים אחרים, כמו שנה וחיפוש, נשארים ללא שינוי.
  function clearDashboardStatusParams() {
    const nextSearchParams =
      new URLSearchParams(searchParams);

    nextSearchParams.delete("status");
    nextSearchParams.delete("risk");

    setSearchParams(nextSearchParams, {
      replace: true
    });
  }

  // מעבר ל"כל המערכות" מבטל את סינון הסטטוס
  // שהגיע מהדשבורד ומציג את הרשימה המלאה.
  function showAllSystems() {
    setViewMode("all");
    setUiStatus("all");
    clearDashboardStatusParams();
  }

  // מאפס את כלל הפילטרים והחיפוש המקומי.
  // ניקוי השנה מחזיר לתצוגת "כל השנים".
  function clearFilters() {
    setFilters({});
    setUiStatus("all");
    setLocalSearch("");
  }

  // מרענן נתונים לאחר שיוך עובדים למערכת.
  async function refreshAfterAssignment() {
    if (selectedSystem) {
      await loadSystemDetails(
        selectedSystem.id
      );
    }

    await loadSystems();
  }

  // מרענן רשימה לאחר יצירת מערכת חדשה.
  async function refreshAfterCreate() {
    await loadSystems();
  }

  // מרענן פרופיל ורשימה לאחר עדכון מערכת.
  async function refreshAfterEdit() {
    if (!selectedSystem) {
      return;
    }

    await loadSystemDetails(
      selectedSystem.id
    );

    await loadSystems();
  }

  return (
    <main
      className="systems-page-shell"
      dir="rtl"
    >
      <UnifiedToolbar
        filters={
          <>
            <label>
              שנה

              <select
                value={filters.year ?? ""}
                onChange={(event) => {
                  const selectedValue =
                    event.target.value;

                  setFilters(
                    (previousFilters) => ({
                      ...previousFilters,
                      year:
                        selectedValue === ""
                          ? undefined
                          : Number(
                              selectedValue
                            )
                    })
                  );
                }}
              >
                {yearOptions.map(
                  (option) => (
                    <option
                      key={option.label}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              מנהל

              <select
                value={
                  filters.ownerManagerName ??
                  ""
                }
                disabled
                title="הסינון יהיה זמין בהמשך"
                onChange={(event) =>
                  setFilters(
                    (previousFilters) => ({
                      ...previousFilters,
                      ownerManagerName:
                        event.target.value ||
                        undefined
                    })
                  )
                }
              >
                <option value="">
                  כל המנהלים
                </option>
              </select>
            </label>

            <label>
              סטטוס

              <select
                value={uiStatus}
                onChange={(event) =>
                  setUiStatus(
                    event.target
                      .value as UiStatus
                  )
                }
              >
                <option value="all">
                  כל הסטטוסים
                </option>

                <option value="shortage">
                  מחסור
                </option>

                <option value="balanced">
                  מאוזן
                </option>

                <option value="excess">
                  עודף
                </option>
              </select>
            </label>

            <label className="systems-search-label">
              חיפוש

              <input
                value={localSearch}
                onChange={(event) =>
                  setLocalSearch(
                    event.target.value
                  )
                }
                placeholder="חיפוש מערכת לפי שם או תחום בעייתי"
              />
            </label>

            <button
              type="button"
              className="secondary-btn unified-clean-btn"
              onClick={clearFilters}
            >
              ניקוי
            </button>
          </>
        }
        summary={
          <>
            {summaryCounts.red > 0 && (
              <span className="unified-stat-pill danger">
                חוסר: {summaryCounts.red}
              </span>
            )}

            {summaryCounts.green > 0 && (
              <span className="unified-stat-pill green">
                זמין:{" "}
                {summaryCounts.green}
              </span>
            )}

            {summaryCounts.balanced >
              0 && (
              <span className="unified-stat-pill neutral">
                מאוזן:{" "}
                {summaryCounts.balanced}
              </span>
            )}
          </>
        }
        grouping={
          <>
            <button
              type="button"
              className={`unified-view-pill ${
                viewMode === "all"
                  ? "active"
                  : ""
              }`}
              onClick={showAllSystems}
            >
              כל המערכות
            </button>

            <button
              type="button"
              className={`unified-view-pill ${
                viewMode === "status"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setViewMode("status")
              }
            >
              קיבוץ לפי מצב
            </button>

            <button
              type="button"
              className={`unified-view-pill ${
                viewMode === "gap"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setViewMode("gap")
              }
            >
              קיבוץ לפי פער קיבולת
            </button>
          </>
        }
        actionButton={
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              setCreateModalOpen(true)
            }
          >
            + הוספת מערכת
          </button>
        }
      />

      {selectedSystem && (
        <div
          ref={profileRef}
          className="systems-profile-board"
        >
          <SystemProfile
            system={selectedSystem}
            loading={loadingDetails}
            onBack={() => {
              setEditModalOpen(false);
              setAssignDrawerOpen(false);
              setSelectedSystem(null);
            }}
            onOpenAssign={() =>
              setAssignDrawerOpen(true)
            }
            onOpenEdit={() =>
              setEditModalOpen(true)
            }
          />
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <section className="systems-board">
        <header className="systems-board-header">
          <div>
            <h2>כל המערכות</h2>

            <p>
              {visibleSystems.length} מערכות
              מוצגות כעת
            </p>
          </div>

          <span className="shortage-counter">
            {summaryCounts.red} במחסור
          </span>
        </header>

        {loadingList && (
          <div className="system-note-box">
            טוען מערכות...
          </div>
        )}

        {!loadingList &&
          viewMode === "all" && (
            <div className="systems-cards-grid">
              {visibleSystems.map(
                (system) => (
                  <SystemCard
                    key={system.id}
                    system={system}
                    selected={
                      selectedSystem?.id ===
                      system.id
                    }
                    onClick={() =>
                      loadSystemDetails(
                        system.id
                      )
                    }
                  />
                )
              )}
            </div>
          )}

        {!loadingList &&
          viewMode === "status" && (
            <div className="systems-groups-stack">
              <SystemGroup
                title="עודף"
                subtitle="מערכות עם יותר קיבולת מוקצית מהנדרש."
                tone="excess"
                systems={
                  statusGroups.excess
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />

              <SystemGroup
                title="מאוזן"
                subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
                tone="balanced"
                systems={
                  statusGroups.balanced
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />

              <SystemGroup
                title="מחסור"
                subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
                tone="shortage"
                systems={
                  statusGroups.shortage
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />
            </div>
          )}

        {!loadingList &&
          viewMode === "gap" && (
            <div className="systems-groups-stack">
              <SystemGroup
                title="עודף"
                subtitle="מערכות עם יותר קיבולת מוקצית מהנדרש."
                tone="excess"
                systems={
                  gapGroups.excess
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />

              <SystemGroup
                title="מאוזן"
                subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
                tone="balanced"
                systems={
                  gapGroups.balanced
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />

              <SystemGroup
                title="מחסור"
                subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
                tone="shortage"
                systems={
                  gapGroups.shortage
                }
                onSystemClick={
                  loadSystemDetails
                }
                selectedSystemId={
                  selectedSystem?.id ??
                  null
                }
              />
            </div>
          )}

        {!loadingList &&
          visibleSystems.length === 0 && (
            <div className="empty-text">
              לא נמצאו מערכות להצגה.
            </div>
          )}
      </section>

      <CreateSystemModal
        open={createModalOpen}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onCreated={refreshAfterCreate}
      />

      <AssignEmployeesDrawer
        open={assignDrawerOpen}
        system={selectedSystem}
        year={
          filters.year ?? activeYear
        }
        onClose={() =>
          setAssignDrawerOpen(false)
        }
        onAssigned={
          refreshAfterAssignment
        }
      />

      <EditSystemModal
        open={editModalOpen}
        system={selectedSystem}
        onClose={() =>
          setEditModalOpen(false)
        }
        onUpdated={refreshAfterEdit}
      />
    </main>
  );
}