import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { useManagers } from "../../../hooks/useManagers";
import type {
  ManagerCandidate,
  ManagerListItem,
  ManagerStatusFilter
} from "../../../types";

import ManagerPickerModal from "./ManagerPickerModal";
import ManagerDeactivateDialog from "./ManagerDeactivateDialog";

interface ManagersSectionProps {
  onReturnHome: () => void;
}

function getStatusLabel(isActive: boolean): string {
  return isActive ? "פעיל" : "לא פעיל";
}

export default function ManagersSection({
  onReturnHome
}: ManagersSectionProps) {
  const {
    managers,
    loading,
    error,
    reloadManagers,
    getCandidates,
    addManager,
    deactivateManager,
    reactivateManager
  } = useManagers("active");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ManagerStatusFilter>("active");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSaving, setPickerSaving] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ManagerCandidate[]>([]);
  const [selectedForDeactivate, setSelectedForDeactivate] = useState<ManagerListItem | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void reloadManagers({
      status: statusFilter,
      search: searchTerm.trim() || undefined
    });
  }, [reloadManagers, searchTerm, statusFilter]);

  const hasFilters = Boolean(searchTerm.trim() || statusFilter !== "active");

  const sortedManagers = useMemo(
    () => [...managers].sort((a, b) => a.fullName.localeCompare(b.fullName, "he")),
    [managers]
  );

  async function loadCandidates(search?: string) {
    setPickerLoading(true);
    setPickerError(null);

    try {
      const rows = await getCandidates(search?.trim() || undefined);
      setCandidates(rows);
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "שגיאה בטעינת עובדים");
    } finally {
      setPickerLoading(false);
    }
  }

  function openPicker() {
    setPickerOpen(true);
    setPickerError(null);
    setCandidates([]);
    void loadCandidates();
  }

  async function handleAddManager(employeeId: string) {
    setPickerSaving(true);
    setPickerError(null);
    setActionError(null);

    try {
      await addManager({ employeeId });
      setPickerOpen(false);
      await reloadManagers({
        status: statusFilter,
        search: searchTerm.trim() || undefined
      });
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "שמירת המנהל נכשלה");
    } finally {
      setPickerSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!selectedForDeactivate) {
      return;
    }

    setDeactivateSaving(true);
    setActionError(null);

    try {
      await deactivateManager(selectedForDeactivate.designationId);
      setSelectedForDeactivate(null);

      await reloadManagers({
        status: statusFilter,
        search: searchTerm.trim() || undefined
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "השבתת המנהל נכשלה");
    } finally {
      setDeactivateSaving(false);
    }
  }

  async function handleReactivate(designationId: string) {
    setActionError(null);

    try {
      await reactivateManager(designationId);
      await reloadManagers({
        status: statusFilter,
        search: searchTerm.trim() || undefined
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "הפעלה מחדש נכשלה");
    }
  }

  return (
    <section className="panel management-section-shell">
      <div className="management-section-topline">
        <div className="management-section-heading">
          <h2>מנהלים</h2>
          <p>ניהול רשימת המנהלים מתוך עובדי הארגון</p>
        </div>

        <button
          type="button"
          className="management-return-home"
          onClick={onReturnHome}
        >
          חזרה למסכי ניהול
        </button>
      </div>

      <div className="management-reserved-toolbar management-managers-toolbar">
        <label className="management-reserved-field" htmlFor="managers-search">
          חיפוש עובד
        </label>

        <div className="management-search-input-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            id="managers-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="חיפוש לפי שם עובד"
          />
        </div>

        <label className="management-reserved-field management-managers-status-filter" htmlFor="managers-status-filter">
          סטטוס
          <select
            id="managers-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ManagerStatusFilter)}
          >
            <option value="active">פעילים</option>
            <option value="inactive">לא פעילים</option>
            <option value="all">הכל</option>
          </select>
        </label>

        <button
          type="button"
          className="primary-btn"
          onClick={openPicker}
        >
          <Plus size={16} aria-hidden="true" />
          הוספת מנהל
        </button>
      </div>

      {loading ? (
        <div className="management-inline-state" role="status" aria-live="polite">
          טוען מנהלים...
        </div>
      ) : null}

      {error ? <div className="management-error-box">{error}</div> : null}
      {actionError ? <div className="management-error-box">{actionError}</div> : null}

      {!loading && !error && sortedManagers.length === 0 && !hasFilters ? (
        <div className="management-empty-state">
          <p>אין מנהלים להצגה</p>
          <small>ניתן להתחיל בלחיצה על הוספת מנהל</small>
        </div>
      ) : null}

      {!loading && !error && sortedManagers.length === 0 && hasFilters ? (
        <div className="management-empty-state">
          <p>לא נמצאו מנהלים התואמים לסינון</p>
          <small>אפשר לנסות ביטוי חיפוש או סטטוס אחר</small>
        </div>
      ) : null}

      {!loading && !error && sortedManagers.length > 0 ? (
        <div className="management-managers-list" role="list" aria-label="רשימת מנהלים">
          {sortedManagers.map((manager) => (
            <div
              key={manager.designationId}
              className={`management-managers-row ${manager.isActive ? "active" : "inactive"}`}
              role="listitem"
            >
              <div className="management-managers-main">
                <div className="management-managers-name-row">
                  <strong>{manager.fullName}</strong>
                  <span className={`management-managers-status ${manager.isActive ? "active" : "inactive"}`}>
                    {getStatusLabel(manager.isActive)}
                  </span>
                </div>

                <p>
                  {manager.professionalCategory}
                  {manager.professionalSubCategory ? ` | ${manager.professionalSubCategory}` : ""}
                </p>

                <small>
                  מספר עובדים: {manager.assignedEmployeesCount}
                </small>
              </div>

              <div className="management-managers-actions">
                {manager.isActive ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setSelectedForDeactivate(manager)}
                  >
                    השבתה
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => void handleReactivate(manager.designationId)}
                  >
                    הפעלה מחדש
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ManagerPickerModal
        open={pickerOpen}
        loading={pickerLoading}
        saving={pickerSaving}
        candidates={candidates}
        error={pickerError}
        onClose={() => setPickerOpen(false)}
        onSearch={(value) => {
          void loadCandidates(value);
        }}
        onSubmit={handleAddManager}
      />

      <ManagerDeactivateDialog
        open={Boolean(selectedForDeactivate)}
        manager={selectedForDeactivate}
        saving={deactivateSaving}
        onClose={() => setSelectedForDeactivate(null)}
        onConfirm={handleDeactivate}
      />
    </section>
  );
}
