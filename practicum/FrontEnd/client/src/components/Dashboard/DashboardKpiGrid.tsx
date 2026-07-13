
import { useEffect, useMemo, useState } from "react";
import { systemService } from "../../services/systemService";
import type { System, SystemDetails } from "../../types";
import AssignEmployeesDrawer from "../Systems/AssignEmployeesDrawer";
import EditSystemModal from "../Systems/EditSystemModal";
import SystemProfile from "../Systems/SystemProfile";
import DashboardKpiCard from "./DashboardKpiCard";
import DashboardKpiDetailsModal, {
  type DashboardKpiModalMode
} from "./DashboardKpiDetailsModal";
import "./DashboardKpiGrid.css";

// ממיר ערך מספרי לאחוז מעוגל.
function toPercent(value: number) {
  return `${Math.round(value)}%`;
}

// מעצב ערך מספרי, כולל תמיכה בחצאי חודשים.
function formatMetricValue(value: number) {
  return new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

// מעצב סכום כספי בשקלים.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(value || 0);
}

// גריד KPI מרכזי בדשבורד.
// אחראי על טעינת הנתונים, חישוב המדדים, פתיחת הפופאפ
// וחיבור פעולות העריכה/השיבוץ/הפרופיל.
export default function DashboardKpiGrid() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] =
    useState<DashboardKpiModalMode | null>(null);

  const [selectedSystem, setSelectedSystem] =
    useState<SystemDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // טעינת נתוני המערכות הראשונית.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialSystems() {
      setLoading(true);

      try {
        const data = await systemService.getSystems();

        if (!cancelled) {
          setSystems(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard KPI systems", error);

        if (!cancelled) {
          setSystems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialSystems();

    return () => {
      cancelled = true;
    };
  }, []);

  // חישובי KPI מרכזיים.
  const metrics = useMemo(() => {
    const totalAllocatedBudget = systems.reduce(
      (sum, system) => sum + (system.allocatedBudget || 0),
      0
    );

    const totalUsedBudget = systems.reduce(
      (sum, system) => sum + (system.usedBudget || 0),
      0
    );

    const totalRequiredCapacity = systems.reduce(
      (sum, system) => sum + (system.requiredCapacityMonths || 0),
      0
    );

    const totalAllocatedCapacity = systems.reduce(
      (sum, system) => sum + (system.allocatedMonths || 0),
      0
    );

    const shortageSystems = systems.filter((system) => system.gap > 0);

    const totalCapacityGap = shortageSystems.reduce(
      (sum, system) => sum + (system.gap || 0),
      0
    );

    const budgetUsagePercent =
      totalAllocatedBudget > 0
        ? (totalUsedBudget / totalAllocatedBudget) * 100
        : 0;

    const budgetOverrunCount = systems.filter(
      (system) => system.budgetGap < 0
    ).length;

    return {
      totalAllocatedBudget,
      totalUsedBudget,
      totalRequiredCapacity,
      totalAllocatedCapacity,
      totalCapacityGap,
      shortageSystems,
      shortageCount: shortageSystems.length,
      budgetUsagePercent,
      budgetOverrunCount
    };
  }, [systems]);

  // טוען פרטים מלאים של מערכת עבור פעולה שדורשת SystemDetails.
  async function loadSystemDetails(systemId: string) {
    setLoadingDetails(true);

    try {
      const details = await systemService.getSystemById(systemId);
      setSelectedSystem(details);
      return details;
    } catch (error) {
      console.error("Failed to load system details from dashboard", error);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }

  // פתיחת מגירת שיבוץ עובדים מתוך הפופאפ.
  async function openAssignment(system: System) {
    const details = await loadSystemDetails(system.id);

    if (details) {
      setAssignDrawerOpen(true);
    }
  }

  // פתיחת מודל עריכת מערכת מתוך הפופאפ.
  async function openEdit(system: System) {
    const details = await loadSystemDetails(system.id);

    if (details) {
      setEditModalOpen(true);
    }
  }

  // פתיחת פרופיל מערכת מלא.
  async function openProfile(system: System) {
    const details = await loadSystemDetails(system.id);

    if (details) {
      setActiveModal(null);
      setProfileOpen(true);
    }
  }

  // רענון הרשימה והמערכת הפעילה לאחר עריכה או שיבוץ.
  async function refreshAfterChange() {
    const systemsData = await systemService.getSystems();
    setSystems(systemsData);

    if (selectedSystem) {
      const refreshedDetails = await systemService.getSystemById(
        selectedSystem.id
      );
      setSelectedSystem(refreshedDetails);
    }
  }

  function closeProfile() {
    setProfileOpen(false);
    setAssignDrawerOpen(false);
    setEditModalOpen(false);
    setSelectedSystem(null);
  }

  const modalSystems =
    activeModal === "budget"
      ? systems
      : metrics.shortageSystems;

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

  return (
    <>
      <section className="dashboard-kpi-grid">
        <DashboardKpiCard
          title="ניצול תקציב"
          value={toPercent(metrics.budgetUsagePercent)}
          description={`${formatCurrency(
            metrics.totalUsedBudget
          )} מתוך ${formatCurrency(metrics.totalAllocatedBudget)}`}
          variant={metrics.budgetOverrunCount > 0 ? "red" : "orange"}
          onClick={() => setActiveModal("budget")}
        />

        <DashboardKpiCard
          title="דורש שיבוץ כוח אדם"
          value={String(metrics.shortageCount)}
          description={`${metrics.shortageCount} מערכות בחוסר מתוך ${systems.length}`}
          variant={metrics.shortageCount > 0 ? "red" : "default"}
          onClick={() => setActiveModal("shortage-count")}
        />

        <DashboardKpiCard
          title="פער קיבולת כולל"
          value={formatMetricValue(
            metrics.totalRequiredCapacity - metrics.totalAllocatedCapacity
          )}
          description={`${formatMetricValue(
            metrics.totalAllocatedCapacity
          )} מוקצים מתוך ${formatMetricValue(
            metrics.totalRequiredCapacity
          )} נדרשים`}
          variant={
            metrics.totalRequiredCapacity - metrics.totalAllocatedCapacity > 0
              ? "red"
              : "default"
          }
          onClick={() => setActiveModal("missing-months")}
        />

        <DashboardKpiCard
          title="סה״כ חודשי מחסור"
          value={formatMetricValue(metrics.totalCapacityGap)}
          description={`${formatMetricValue(
            metrics.totalCapacityGap
          )} חודשים חסרים במערכות שבמחסור`}
          variant={metrics.totalCapacityGap > 0 ? "red" : "default"}
          onClick={() => setActiveModal("capacity-gap")}
        />
      </section>

      <DashboardKpiDetailsModal
        open={activeModal !== null}
        mode={activeModal ?? "shortage-count"}
        systems={modalSystems}
        onClose={() => setActiveModal(null)}
        onAssign={(system) => void openAssignment(system)}
        onEdit={(system) => void openEdit(system)}
        onOpenProfile={(system) => void openProfile(system)}
      />

      {profileOpen && selectedSystem && (
        <SystemProfile
          system={selectedSystem}
          loading={loadingDetails}
          onBack={closeProfile}
          onOpenAssign={() => setAssignDrawerOpen(true)}
          onOpenEdit={() => setEditModalOpen(true)}
        />
      )}

      <AssignEmployeesDrawer
        open={assignDrawerOpen}
        system={selectedSystem}
        year={
          selectedSystem?.year && selectedSystem.year > 0
            ? selectedSystem.year
            : new Date().getFullYear()
        }
        onClose={() => setAssignDrawerOpen(false)}
        onAssigned={refreshAfterChange}
      />

      <EditSystemModal
        open={editModalOpen}
        system={selectedSystem}
        onClose={() => setEditModalOpen(false)}
        onUpdated={refreshAfterChange}
      />
    </>
  );
}