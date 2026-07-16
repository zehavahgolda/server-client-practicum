import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type {
  OrganizationEventScopeType,
  System
} from "../../../types";

interface OrganizationEventFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  systems: System[];
  initialValue?: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    scopeType: OrganizationEventScopeType;
    targetSystemIds: string[];
  };
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    scopeType: OrganizationEventScopeType;
    targetSystemIds: string[];
  }) => Promise<void>;
}

const scopeOptions: Array<{ value: OrganizationEventScopeType; label: string }> = [
  { value: "AllOrganization", label: "כל הארגון" },
  { value: "SelectedSystems", label: "מערכות נבחרות" }
];

export default function OrganizationEventFormModal({
  open,
  mode,
  systems,
  initialValue,
  saving,
  error,
  onClose,
  onSubmit
}: OrganizationEventFormModalProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [startDate, setStartDate] = useState(initialValue?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValue?.endDate ?? "");
  const [scopeType, setScopeType] = useState<OrganizationEventScopeType>(initialValue?.scopeType ?? "AllOrganization");
  const [targetSystemIds, setTargetSystemIds] = useState<string[]>(initialValue?.targetSystemIds ?? []);
  const [systemSearch, setSystemSearch] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(initialValue?.title ?? "");
    setDescription(initialValue?.description ?? "");
    setStartDate(initialValue?.startDate ?? "");
    setEndDate(initialValue?.endDate ?? "");
    setScopeType(initialValue?.scopeType ?? "AllOrganization");
    setTargetSystemIds(initialValue?.targetSystemIds ?? []);
    setSystemSearch("");
    setTouched(false);
  }, [initialValue, open]);

  const selectedSystems = useMemo(
    () => systems.filter((system) => targetSystemIds.includes(system.id)),
    [systems, targetSystemIds]
  );

  const availableSystems = useMemo(() => {
    const query = systemSearch.trim().toLowerCase();

    return systems.filter((system) => {
      if (targetSystemIds.includes(system.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return system.name.toLowerCase().includes(query);
    });
  }, [systemSearch, systems, targetSystemIds]);

  if (!open) {
    return null;
  }

  const normalizedTitle = title.trim();
  const titleError = touched && !normalizedTitle ? "יש להזין כותרת" : null;
  const startDateError = touched && !startDate ? "יש לבחור תאריך התחלה" : null;
  const systemsError = touched && scopeType === "SelectedSystems" && targetSystemIds.length === 0
    ? "יש לבחור לפחות מערכת אחת"
    : null;
  const rangeError = touched && startDate && endDate && endDate < startDate
    ? "תאריך סיום לא יכול להיות מוקדם מתאריך התחלה"
    : null;

  function addSystem(systemId: string) {
    setTargetSystemIds((current) => current.includes(systemId) ? current : [...current, systemId]);
  }

  function removeSystem(systemId: string) {
    setTargetSystemIds((current) => current.filter((id) => id !== systemId));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    if (!normalizedTitle || !startDate || rangeError) {
      return;
    }

    if (scopeType === "SelectedSystems" && targetSystemIds.length === 0) {
      return;
    }

    await onSubmit({
      title: normalizedTitle,
      description: description.trim() || null,
      startDate,
      endDate: endDate || null,
      scopeType,
      targetSystemIds: scopeType === "AllOrganization" ? [] : targetSystemIds
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card management-org-event-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <div className="modal-header">
          <h3>{mode === "create" ? "הוספת אירוע כלל־ארגוני" : "עריכת אירוע כלל־ארגוני"}</h3>
          <p>ניהול אירועים רוחביים והיסטוריית אירועים ארגוניים</p>
        </div>

        <form className="modal-form management-org-event-form" onSubmit={handleSubmit} noValidate>
          <label className="management-org-event-form-field">
            <span>כותרת האירוע</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => setTouched(true)} autoFocus />
          </label>

          <div className="management-org-event-form-dates">
            <label className="management-org-event-form-field">
              <span>תאריך התחלה</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} onBlur={() => setTouched(true)} />
            </label>

            <label className="management-org-event-form-field">
              <span>תאריך סיום</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} onBlur={() => setTouched(true)} />
            </label>
          </div>

          <label className="management-org-event-form-field">
            <span>פירוט האירוע</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
          </label>

          <fieldset className="management-org-event-form-scope">
            <legend>היקף האירוע</legend>
            <div className="management-org-event-form-scope-options">
              {scopeOptions.map((option) => (
                <label key={option.value} className="management-org-event-form-scope-option">
                  <input
                    type="radio"
                    name="organization-event-scope"
                    value={option.value}
                    checked={scopeType === option.value}
                    onChange={() => {
                      setScopeType(option.value);
                      if (option.value === "AllOrganization") {
                        setTargetSystemIds([]);
                      }
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {scopeType === "SelectedSystems" ? (
            <div className="management-org-event-form-systems">
              <div className="management-org-event-form-field">
                <span>בחירת מערכות</span>
                <div className="management-org-event-system-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={systemSearch}
                    onChange={(event) => setSystemSearch(event.target.value)}
                    placeholder="חיפוש מערכת"
                  />
                </div>
              </div>

              {selectedSystems.length > 0 ? (
                <div className="management-org-event-selected-systems">
                  {selectedSystems.map((system) => (
                    <button
                      type="button"
                      key={system.id}
                      className="management-org-event-system-chip"
                      onClick={() => removeSystem(system.id)}
                    >
                      <span>{system.name}</span>
                      <X size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="management-org-event-system-list" role="list" aria-label="מערכות לבחירה">
                {availableSystems.map((system) => (
                  <button
                    type="button"
                    key={system.id}
                    className="management-org-event-system-option"
                    onClick={() => addSystem(system.id)}
                  >
                    {system.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {titleError ? <p className="modal-warning-text">{titleError}</p> : null}
          {startDateError ? <p className="modal-warning-text">{startDateError}</p> : null}
          {systemsError ? <p className="modal-warning-text">{systemsError}</p> : null}
          {rangeError ? <p className="modal-warning-text">{rangeError}</p> : null}
          {error ? <p className="modal-warning-text">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>
              ביטול
            </button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "שומר..." : "שמירה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}