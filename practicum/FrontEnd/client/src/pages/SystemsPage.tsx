// // import { useMemo } from "react";
// // import { useSearchParams } from "react-router-dom";
// // import { useSystems } from "../hooks/useSystems";
// // import SystemCard from "../components/Systems/SystemCard";
// // import SystemProfile from "../components/Systems/SystemProfile";

// // function getShortageCount(systems: { gap: number }[]) {
// //   return systems.filter((system) => system.gap > 0).length;
// // }

// // export default function SystemsPage() {
// //   const [searchParams] = useSearchParams();
// //   const riskFilter = searchParams.get("risk");

// //   const {
// //     systems,
// //     selectedSystem,
// //     loadingList,
// //     loadingDetails,
// //     error,
// //     filters,
// //     setFilters,
// //     loadSystemDetails,
// //     setSelectedSystem
// //   } = useSystems();

// //   const visibleSystems = useMemo(() => {
// //     if (riskFilter === "at-risk") {
// //       return systems.filter((system) => system.gap > 4);
// //     }

// //     if (riskFilter === "shortage") {
// //       return systems.filter((system) => system.gap > 0);
// //     }

// //     if (riskFilter === "balanced") {
// //       return systems.filter((system) => system.gap <= 0);
// //     }

// //     return systems;
// //   }, [systems, riskFilter]);

// //   const statuses = useMemo(
// //     () => [...new Set(systems.map((system) => system.capacityStatus).filter(Boolean))],
// //     [systems]
// //   );

// //   if (selectedSystem) {
// //     return (
// //       <main className="systems-page-shell" dir="rtl">
// //         <SystemProfile
// //           system={selectedSystem}
// //           loading={loadingDetails}
// //           onBack={() => setSelectedSystem(null)}
// //         />
// //       </main>
// //     );
// //   }

// //   return (
// //     <main className="systems-page-shell" dir="rtl">
// //       <nav className="systems-tabs">
// //         <button type="button">דשבורד ניהולי</button>
// //         <button type="button" className="active">
// //           מערכות
// //         </button>
// //         <button type="button">עובדים</button>
// //       </nav>

// //       <section className="systems-toolbar-card">
// //         <div className="systems-filter-row">
// //           <label>
// //             סינון
// //             <select
// //               value={filters.year ?? 2026}
// //               onChange={(event) =>
// //                 setFilters((prev) => ({
// //                   ...prev,
// //                   year: Number(event.target.value)
// //                 }))
// //               }
// //             >
// //               <option value={2026}>2026</option>
// //               <option value={2025}>2025</option>
// //               <option value={2027}>2027</option>
// //             </select>
// //           </label>

// //           <label>
// //             קטגוריה
// //             <select>
// //               <option>כל הקטגוריות</option>
// //             </select>
// //           </label>

// //           <label>
// //             מנהל
// //             <select
// //               value={filters.ownerManagerName ?? ""}
// //               onChange={(event) =>
// //                 setFilters((prev) => ({
// //                   ...prev,
// //                   ownerManagerName: event.target.value || undefined
// //                 }))
// //               }
// //             >
// //               <option value="">כל המנהלים</option>
// //             </select>
// //           </label>

// //           <label>
// //             סטטוס
// //             <select
// //               value={filters.status ?? ""}
// //               onChange={(event) =>
// //                 setFilters((prev) => ({
// //                   ...prev,
// //                   status: event.target.value || undefined
// //                 }))
// //               }
// //             >
// //               <option value="">כל הסטטוסים</option>
// //               {statuses.map((status) => (
// //                 <option key={status} value={status}>
// //                   {status}
// //                 </option>
// //               ))}
// //             </select>
// //           </label>

// //           <label className="systems-search-label">
// //             חיפוש
// //             <input
// //               value={filters.search ?? ""}
// //               onChange={(event) =>
// //                 setFilters((prev) => ({
// //                   ...prev,
// //                   search: event.target.value
// //                 }))
// //               }
// //               placeholder="חיפוש מערכת לפי שם או תחום בעייתי"
// //             />
// //           </label>

// //           <button
// //             type="button"
// //             className="secondary-btn clean-btn"
// //             onClick={() => setFilters({})}
// //           >
// //             ניקוי
// //           </button>
// //         </div>

// //         <div className="systems-toolbar-divider" />

// //         <div className="systems-actions-row">
// //           <span>פעולות</span>
// //           <button type="button" className="primary-btn">
// //             + הוספת מערכת
// //           </button>
// //         </div>

// //         <div className="systems-view-row">
// //           <span>תצוגה</span>
// //           <button type="button" className="view-pill active">
// //             כל המערכות
// //           </button>
// //           <button type="button" className="view-pill">
// //             קיבוץ לפי מצב
// //           </button>
// //           <button type="button" className="view-pill">
// //             קיבוץ לפי פער קיבולת
// //           </button>
// //         </div>
// //       </section>

// //       <section className="systems-overview-title">
// //         <h1>מבט מערכות</h1>
// //         <p>סקירת כל המערכות, קיבוץ לפי מצב עסקי או פער קיבולת, וכניסה לפרופיל מערכת.</p>
// //       </section>

// //       {error && <div className="error-box">{error}</div>}

// //       <section className="systems-board">
// //         <header className="systems-board-header">
// //           <div>
// //             <h2>כל המערכות</h2>
// //             <p>{visibleSystems.length} מערכות מוצגות כעת</p>
// //           </div>

// //           <span className="shortage-counter">
// //             {getShortageCount(visibleSystems)} במחסור
// //           </span>
// //         </header>

// //         {loadingList ? (
// //           <div className="system-note-box">טוען מערכות...</div>
// //         ) : (
// //           <div className="systems-cards-grid">
// //             {visibleSystems.map((system) => (
// //               <SystemCard
// //                 key={system.id}
// //                 system={system}
// //                 selected={false}
// //                 onClick={() => loadSystemDetails(system.id)}
// //               />
// //             ))}
// //           </div>
// //         )}

// //         {!loadingList && visibleSystems.length === 0 && (
// //           <div className="empty-text">לא נמצאו מערכות להצגה.</div>
// //         )}
// //       </section>
// //     </main>
// //   );
// // }
// import { useMemo, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useSystems } from "../hooks/useSystems";
// import type { System } from "../types";
// import SystemCard from "../components/Systems/SystemCard";
// import SystemProfile from "../components/Systems/SystemProfile";
// import SystemGroup from "../components/Systems/SystemGroup";

// type ViewMode = "all" | "status" | "gap";
// type UiStatus = "all" | "shortage" | "balanced" | "excess";

// function getSystemTone(system: System): "shortage" | "balanced" | "excess" {
//   if (system.gap > 0) return "shortage";
//   if (system.gap < 0) return "excess";
//   return "balanced";
// }

// function getShortageCount(systems: System[]) {
//   return systems.filter((system) => system.gap > 0).length;
// }

// function matchesStatus(system: System, status: UiStatus) {
//   if (status === "all") return true;
//   return getSystemTone(system) === status;
// }

// function matchesSearch(system: System, search: string) {
//   const value = search.trim().toLowerCase();

//   if (!value) return true;

//   const searchableText = [
//     system.name,
//     system.capacityStatus,
//     system.managementNote,
//     system.requiredCapacityMonths,
//     system.allocatedMonths,
//     system.gap,
//     system.assignedEmployeesCount
//   ]
//     .filter((item) => item !== undefined && item !== null)
//     .join(" ")
//     .toLowerCase();

//   return searchableText.includes(value);
// }

// function getStatusGroups(systems: System[]) {
//   return {
//     excess: systems.filter((system) => system.gap < 0),
//     balanced: systems.filter((system) => system.gap === 0),
//     shortage: systems.filter((system) => system.gap > 0)
//   };
// }

// function getGapGroups(systems: System[]) {
//   return {
//     healthy: systems.filter((system) => system.gap <= 0),
//     regularShortage: systems.filter((system) => system.gap > 0 && system.gap <= 4),
//     criticalShortage: systems.filter((system) => system.gap > 4)
//   };
// }

// export default function SystemsPage() {
//   const [searchParams] = useSearchParams();
//   const riskFilter = searchParams.get("risk");

//   const [viewMode, setViewMode] = useState<ViewMode>("all");
//   const [uiStatus, setUiStatus] = useState<UiStatus>("all");
//   const [localSearch, setLocalSearch] = useState("");

//   const {
//     systems,
//     selectedSystem,
//     loadingList,
//     loadingDetails,
//     error,
//     filters,
//     setFilters,
//     loadSystemDetails,
//     setSelectedSystem
//   } = useSystems();

//   const visibleSystems = useMemo(() => {
//     let result = systems;

//     if (riskFilter === "at-risk") {
//       result = result.filter((system) => system.gap > 4);
//     }

//     if (riskFilter === "shortage") {
//       result = result.filter((system) => system.gap > 0);
//     }

//     if (riskFilter === "balanced") {
//       result = result.filter((system) => system.gap <= 0);
//     }

//     result = result.filter((system) => matchesStatus(system, uiStatus));
//     result = result.filter((system) => matchesSearch(system, localSearch));

//     return result;
//   }, [systems, riskFilter, uiStatus, localSearch]);

//   const statusGroups = useMemo(() => getStatusGroups(visibleSystems), [visibleSystems]);
//   const gapGroups = useMemo(() => getGapGroups(visibleSystems), [visibleSystems]);

//   function clearFilters() {
//     setFilters({});
//     setUiStatus("all");
//     setLocalSearch("");
//   }

//   if (selectedSystem) {
//     return (
//       <main className="systems-page-shell" dir="rtl">
//         <SystemProfile
//           system={selectedSystem}
//           loading={loadingDetails}
//           onBack={() => setSelectedSystem(null)}
//         />
//       </main>
//     );
//   }

//   return (
//     <main className="systems-page-shell" dir="rtl">
//       <nav className="systems-tabs">
//         <button type="button">דשבורד ניהולי</button>
//         <button type="button" className="active">מערכות</button>
//         <button type="button">עובדים</button>
//       </nav>

//       <section className="systems-toolbar-card">
//         <div className="systems-filter-row">
//           <label>
//             סינון
//             <select
//               value={filters.year ?? 2026}
//               onChange={(event) =>
//                 setFilters((prev) => ({
//                   ...prev,
//                   year: Number(event.target.value)
//                 }))
//               }
//             >
//               <option value={2026}>2026</option>
//               <option value={2025}>2025</option>
//               <option value={2027}>2027</option>
//             </select>
//           </label>

//           <label>
//             קטגוריה
//             <select>
//               <option>כל הקטגוריות</option>
//             </select>
//           </label>

//           <label>
//             מנהל
//             <select
//               value={filters.ownerManagerName ?? ""}
//               onChange={(event) =>
//                 setFilters((prev) => ({
//                   ...prev,
//                   ownerManagerName: event.target.value || undefined
//                 }))
//               }
//             >
//               <option value="">כל המנהלים</option>
//             </select>
//           </label>

//           <label>
//             סטטוס
//             <select
//               value={uiStatus}
//               onChange={(event) => setUiStatus(event.target.value as UiStatus)}
//             >
//               <option value="all">כל הסטטוסים</option>
//               <option value="shortage">מחסור</option>
//               <option value="balanced">מאוזן</option>
//               <option value="excess">עודף</option>
//             </select>
//           </label>

//           <label className="systems-search-label">
//             חיפוש
//             <input
//               value={localSearch}
//               onChange={(event) => setLocalSearch(event.target.value)}
//               placeholder="חיפוש מערכת לפי שם או תחום בעייתי"
//             />
//           </label>

//           <button
//             type="button"
//             className="secondary-btn clean-btn"
//             onClick={clearFilters}
//           >
//             ניקוי
//           </button>
//         </div>

//         <div className="systems-toolbar-divider" />

//         <div className="systems-actions-row">
//           <span>פעולות</span>
//           <button type="button" className="primary-btn">+ הוספת מערכת</button>
//         </div>

//         <div className="systems-view-row">
//           <span>תצוגה</span>

//           <button
//             type="button"
//             className={`view-pill ${viewMode === "all" ? "active" : ""}`}
//             onClick={() => setViewMode("all")}
//           >
//             כל המערכות
//           </button>

//           <button
//             type="button"
//             className={`view-pill ${viewMode === "status" ? "active" : ""}`}
//             onClick={() => setViewMode("status")}
//           >
//             קיבוץ לפי מצב
//           </button>

//           <button
//             type="button"
//             className={`view-pill ${viewMode === "gap" ? "active" : ""}`}
//             onClick={() => setViewMode("gap")}
//           >
//             קיבוץ לפי פער קיבולת
//           </button>
//         </div>
//       </section>

//       <section className="systems-overview-title">
//         <h1>מבט מערכות</h1>
//         <p>סקירת כל המערכות, קיבוץ לפי מצב עסקי או פער קיבולת, וכניסה לפרופיל מערכת.</p>
//       </section>

//       {error && <div className="error-box">{error}</div>}

//       <section className="systems-board">
//         <header className="systems-board-header">
//           <div>
//             <h2>כל המערכות</h2>
//             <p>{visibleSystems.length} מערכות מוצגות כעת</p>
//           </div>

//           <span className="shortage-counter">
//             {getShortageCount(visibleSystems)} במחסור
//           </span>
//         </header>

//         {loadingList && <div className="system-note-box">טוען מערכות...</div>}

//         {!loadingList && viewMode === "all" && (
//           <div className="systems-cards-grid">
//             {visibleSystems.map((system) => (
//               <SystemCard
//                 key={system.id}
//                 system={system}
//                 selected={false}
//                 onClick={() => loadSystemDetails(system.id)}
//               />
//             ))}
//           </div>
//         )}

//         {!loadingList && viewMode === "status" && (
//           <div className="systems-groups-stack">
//             <SystemGroup
//               title="עודף"
//               subtitle="מערכות עם יותר קיבולת מוקצית מהנדרש."
//               tone="excess"
//               systems={statusGroups.excess}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />

//             <SystemGroup
//               title="מאוזן"
//               subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
//               tone="balanced"
//               systems={statusGroups.balanced}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />

//             <SystemGroup
//               title="מחסור"
//               subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
//               tone="shortage"
//               systems={statusGroups.shortage}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />
//           </div>
//         )}

//         {!loadingList && viewMode === "gap" && (
//           <div className="systems-groups-stack">
//             <SystemGroup
//               title="מאוזן או עודף קיבולת"
//               subtitle="מערכות שאינן דורשות תגבור כרגע."
//               tone="excess"
//               systems={gapGroups.healthy}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />

//             <SystemGroup
//               title="מחסור רגיל"
//               subtitle="פער קיבולת קטן יחסית, עד 4 חודשי עבודה."
//               tone="balanced"
//               systems={gapGroups.regularShortage}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />

//             <SystemGroup
//               title="פער קריטי מעל 4 חודשים"
//               subtitle="מערכות עם מחסור משמעותי שדורש תשומת לב ניהולית."
//               tone="shortage"
//               systems={gapGroups.criticalShortage}
//               defaultOpen
//               onSystemClick={loadSystemDetails}
//             />
//           </div>
//         )}

//         {!loadingList && visibleSystems.length === 0 && (
//           <div className="empty-text">לא נמצאו מערכות להצגה.</div>
//         )}
//       </section>
//     </main>
//   );
// }
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSystems } from "../hooks/useSystems";
import type { System } from "../types";
import SystemCard from "../components/Systems/SystemCard";
import SystemProfile from "../components/Systems/SystemProfile";
import SystemGroup from "../components/Systems/SystemGroup";
import AssignEmployeesDrawer from "../components/Systems/AssignEmployeesDrawer";

type ViewMode = "all" | "status" | "gap";
type UiStatus = "all" | "shortage" | "balanced" | "excess";

function getSystemTone(system: System): "shortage" | "balanced" | "excess" {
  if (system.gap > 0) return "shortage";
  if (system.gap < 0) return "excess";
  return "balanced";
}

function getShortageCount(systems: System[]) {
  return systems.filter((system) => system.gap > 0).length;
}

function matchesStatus(system: System, status: UiStatus) {
  if (status === "all") return true;
  return getSystemTone(system) === status;
}

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

function getStatusGroups(systems: System[]) {
  return {
    excess: systems.filter((system) => system.gap < 0),
    balanced: systems.filter((system) => system.gap === 0),
    shortage: systems.filter((system) => system.gap > 0)
  };
}

function getGapGroups(systems: System[]) {
  return {
    healthy: systems.filter((system) => system.gap <= 0),
    regularShortage: systems.filter((system) => system.gap > 0 && system.gap <= 4),
    criticalShortage: systems.filter((system) => system.gap > 4)
  };
}

export default function SystemsPage() {
  const [searchParams] = useSearchParams();
  const riskFilter = searchParams.get("risk");

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [uiStatus, setUiStatus] = useState<UiStatus>("all");
  const [localSearch, setLocalSearch] = useState("");
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);

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

  const visibleSystems = useMemo(() => {
    let result = systems;

    if (riskFilter === "at-risk") {
      result = result.filter((system) => system.gap > 4);
    }

    if (riskFilter === "shortage") {
      result = result.filter((system) => system.gap > 0);
    }

    if (riskFilter === "balanced") {
      result = result.filter((system) => system.gap <= 0);
    }

    result = result.filter((system) => matchesStatus(system, uiStatus));
    result = result.filter((system) => matchesSearch(system, localSearch));

    return result;
  }, [systems, riskFilter, uiStatus, localSearch]);

  const statusGroups = useMemo(() => getStatusGroups(visibleSystems), [visibleSystems]);
  const gapGroups = useMemo(() => getGapGroups(visibleSystems), [visibleSystems]);

  function clearFilters() {
    setFilters({});
    setUiStatus("all");
    setLocalSearch("");
  }

  async function refreshAfterAssignment() {
    if (selectedSystem) {
      await loadSystemDetails(selectedSystem.id);
    }

    await loadSystems();
  }

  if (selectedSystem) {
    return (
      <main className="systems-page-shell" dir="rtl">
        <SystemProfile
          system={selectedSystem}
          loading={loadingDetails}
          onBack={() => setSelectedSystem(null)}
          onOpenAssign={() => setAssignDrawerOpen(true)}
        />

        <AssignEmployeesDrawer
          open={assignDrawerOpen}
          system={selectedSystem}
          year={filters.year ?? 2026}
          onClose={() => setAssignDrawerOpen(false)}
          onAssigned={refreshAfterAssignment}
        />
      </main>
    );
  }

  return (
    <main className="systems-page-shell" dir="rtl">
      <nav className="systems-tabs">
        <button type="button">דשבורד ניהולי</button>
        <button type="button" className="active">
          מערכות
        </button>
        <button type="button">עובדים</button>
      </nav>

      <section className="systems-toolbar-card">
        <div className="systems-filter-row">
          <label>
            סינון
            <select
              value={filters.year ?? 2026}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  year: Number(event.target.value)
                }))
              }
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </label>

          <label>
            קטגוריה
            <select>
              <option>כל הקטגוריות</option>
            </select>
          </label>

          <label>
            מנהל
            <select
              value={filters.ownerManagerName ?? ""}
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
          <button type="button" className="primary-btn">
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

          <span className="shortage-counter">{getShortageCount(visibleSystems)} במחסור</span>
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
              defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="מאוזן"
              subtitle="מערכות שמוקצות בדיוק לפי הדרישה."
              tone="balanced"
              systems={statusGroups.balanced}
              defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="מחסור"
              subtitle="מערכות שחסרה להן קיבולת ויש לטפל בהן."
              tone="shortage"
              systems={statusGroups.shortage}
              defaultOpen
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
              defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="מחסור רגיל"
              subtitle="פער קיבולת קטן יחסית, עד 4 חודשי עבודה."
              tone="balanced"
              systems={gapGroups.regularShortage}
              defaultOpen
              onSystemClick={loadSystemDetails}
            />

            <SystemGroup
              title="פער קריטי מעל 4 חודשים"
              subtitle="מערכות עם מחסור משמעותי שדורש תשומת לב ניהולית."
              tone="shortage"
              systems={gapGroups.criticalShortage}
              defaultOpen
              onSystemClick={loadSystemDetails}
            />
          </div>
        )}

        {!loadingList && visibleSystems.length === 0 && (
          <div className="empty-text">לא נמצאו מערכות להצגה.</div>
        )}
      </section>
    </main>
  );
}