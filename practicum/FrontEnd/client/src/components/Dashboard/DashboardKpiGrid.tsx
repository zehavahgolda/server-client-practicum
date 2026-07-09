import { useEffect, useState } from "react";
import { systemService } from "../../services/systemService";
import type { System, SystemDetails } from "../../types";
import AssignEmployeesDrawer from "../Systems/AssignEmployeesDrawer";
import EditSystemModal from "../Systems/EditSystemModal";
import SystemCard from "../Systems/SystemCard";
import SystemProfile from "../Systems/SystemProfile";
import DashboardKpiCard from "./DashboardKpiCard";
import "./DashboardKpiGrid.css";

// ממיר ערך מספרי לאחוז מעוגל לתצוגה בכרטיסי KPI.
function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

// מעצב ערך מספרי רגיל להצגה אחידה, כולל תמיכה בחצאי חודשים.
function formatMetricValue(value: number) {
  return new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

// מעצב ערך כספי לפי פורמט מטבע ישראלי להצגה אחידה.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

// גריד KPI מרכזי בדשבורד שמחשב ומציג מדדים מתוך נתוני המערכות.
export default function DashboardKpiGrid() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [shortageModalOpen, setShortageModalOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // טוען את רשימת המערכות ליצירת מדדי KPI ומונע עדכון סטייט אחרי unmount.
    async function loadSystems() {
      try {
        const data = await systemService.getSystems();

        if (isMounted) {
          setSystems(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard KPI systems", error);

        if (isMounted) {
          setSystems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSystems();

    return () => {
      isMounted = false;
    };
  }, []);

  // תצוגת ביניים בזמן טעינת נתוני הדשבורד.
  if (loading) {
    return (
      <section className="dashboard-kpi-grid">
        <DashboardKpiCard
          title="טוען..."
          value="..."
          description="מחשב נתוני דשבורד"
        />
      </section>
    );
  }

  // חישוב מדדי תקציב כוללים עבור כלל המערכות.
  const totalAllocatedBudget = systems.reduce(
    (sum, system) => sum + (system.allocatedBudget || 0),
    0
  );

  const totalUsedBudget = systems.reduce(
    (sum, system) => sum + (system.usedBudget || 0),
    0
  );

  const budgetUsagePercent =
    totalAllocatedBudget > 0 ? (totalUsedBudget / totalAllocatedBudget) * 100 : 0;

  // חישוב מדדי קיבולת לצורך כרטיסי KPI תפעוליים.
  const totalRequiredCapacity = systems.reduce(
    (sum, system) => sum + (system.requiredCapacityMonths || 0),
    0
  );

  // מדדי מצב מערכתיים: חוסר/איזון/חריגות תקציב.
  const totalCapacityGap = systems.reduce(
    (sum, system) => sum + Math.max(system.gap || 0, 0),
    0
  );

  const shortageCount = systems.filter((system) => system.gap > 0).length;
  const budgetOverrunCount = systems.filter((system) => system.budgetGap < 0).length;
  const shortageSystems = systems.filter((system) => system.gap > 0);

  async function refreshSystems() {
    const data = await systemService.getSystems();
    setSystems(data);
  }

  async function openSystemProfile(systemId: string) {
    setLoadingDetails(true);

    try {
      const data = await systemService.getSystemById(systemId);
      setSelectedSystem(data);
    } catch (error) {
      console.error("Failed to load system profile from dashboard", error);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function refreshSelectedSystem() {
    if (!selectedSystem) {
      await refreshSystems();
      return;
    }

    const [systemsData, detailsData] = await Promise.all([
      systemService.getSystems(),
      systemService.getSystemById(selectedSystem.id)
    ]);

    setSystems(systemsData);
    setSelectedSystem(detailsData);
  }

  return (
    <>
      <section className="dashboard-kpi-grid">
        <DashboardKpiCard
          title="ניצול תקציב"
          value={toPercent(budgetUsagePercent)}
          description={`${formatCurrency(totalUsedBudget)} מתוך ${formatCurrency(totalAllocatedBudget)}`}
          variant={budgetOverrunCount > 0 ? "red" : "orange"}
        />

        <DashboardKpiCard
          title="מערכות בחוסר"
          value={formatMetricValue(shortageCount)}
          description={`${shortageCount} מערכות בחוסר מתוך ${systems.length}`}
          variant="blue"
          onClick={() => setShortageModalOpen(true)}
        />

        <DashboardKpiCard
          title="קיבולת חסרה"
          value={formatMetricValue(totalCapacityGap)}
          description={`${totalCapacityGap} חודשי עבודה חסרים מתוך ${totalRequiredCapacity}`}
          onClick={() => setShortageModalOpen(true)}
        />

        <DashboardKpiCard
          title="פער קיבולת כולל"
          value={formatMetricValue(totalCapacityGap)}
          description="חודשי עבודה חסרים"
          variant={totalCapacityGap > 0 ? "red" : "default"}
        />

        <DashboardKpiCard
          title="מערכות בחריגת תקציב"
          value={String(budgetOverrunCount)}
          description={
            budgetOverrunCount > 0
              ? "יש מערכות שחרגו מהתקציב"
              : `אין חריגות תקציב · ${shortageCount} מערכות בחוסר קיבולת`
          }
          variant={budgetOverrunCount > 0 ? "red" : "default"}
        />
      </section>

      {shortageModalOpen && !selectedSystem && (
        <div className="modal-overlay dashboard-shortage-modal-overlay" onClick={() => setShortageModalOpen(false)}>
          <div
            className="modal-card dashboard-shortage-modal-card"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close-btn" onClick={() => setShortageModalOpen(false)}>
              ×
            </button>

            <div className="dashboard-shortage-modal-header">
              <h3>מערכות בחוסר</h3>
              <p>בחר מערכת כדי לפתוח אותה בפופאפ ולטפל בפער הקיבולת.</p>
            </div>

            {shortageSystems.length === 0 ? (
              <div className="empty-text">אין כרגע מערכות בחוסר.</div>
            ) : (
              <div className="dashboard-shortage-grid">
                {shortageSystems.map((system) => (
                  <SystemCard
                    key={system.id}
                    system={system}
                    selected={false}
                    onClick={() => void openSystemProfile(system.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSystem && (
        <>
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
            year={new Date().getFullYear()}
            onClose={() => setAssignDrawerOpen(false)}
            onAssigned={refreshSelectedSystem}
          />

          <EditSystemModal
            open={editModalOpen}
            system={selectedSystem}
            onClose={() => setEditModalOpen(false)}
            onUpdated={refreshSelectedSystem}
          />
        </>
      )}
    </>
  );
}