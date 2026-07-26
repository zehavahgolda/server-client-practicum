import { useEffect, useMemo, useState } from "react";
import type { ManagerCandidate } from "../../../types";

interface ManagerPickerModalProps {
  open: boolean;
  loading: boolean;
  saving: boolean;
  candidates: ManagerCandidate[];
  error: string | null;
  onClose: () => void;
  onSearch: (value: string) => void;
  onSubmit: (employeeId: string) => Promise<void>;
}

export default function ManagerPickerModal({
  open,
  loading,
  saving,
  candidates,
  error,
  onClose,
  onSearch,
  onSubmit
}: ManagerPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedEmployeeId("");
      return;
    }

    onSearch("");
  }, [open, onSearch]);

  const visibleCandidates = useMemo(() => candidates, [candidates]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployeeId || saving) {
      return;
    }

    await onSubmit(selectedEmployeeId);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    onSearch(value);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card management-managers-picker"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="סגירה"
          disabled={saving}
        >
          ×
        </button>

        <div className="modal-header">
          <h3>הוספת מנהל</h3>
          <p>בחירת עובד פעיל להגדרת מנהל</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="management-managers-picker-search">
            חיפוש עובד
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="חיפוש לפי שם עובד"
              disabled={saving}
            />
          </label>

          {error ? <div className="management-error-box">{error}</div> : null}

          <div className="management-managers-picker-list" role="list" aria-label="רשימת עובדים לבחירת מנהל">
            {loading ? (
              <div className="management-inline-state">טוען עובדים...</div>
            ) : null}

            {!loading && visibleCandidates.length === 0 ? (
              <div className="management-empty-state management-managers-picker-empty">
                <p>לא נמצאו עובדים מתאימים</p>
              </div>
            ) : null}

            {!loading &&
              visibleCandidates.map((candidate) => {
                const isBlocked = candidate.hasActiveDesignation;
                const isSelected = selectedEmployeeId === candidate.employeeId;

                return (
                  <label
                    key={candidate.employeeId}
                    className={`management-managers-picker-row ${isBlocked ? "blocked" : ""} ${isSelected ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="managerCandidate"
                      value={candidate.employeeId}
                      checked={isSelected}
                      onChange={() => setSelectedEmployeeId(candidate.employeeId)}
                      disabled={isBlocked || saving}
                    />

                    <div className="management-managers-picker-main">
                      <strong>{candidate.fullName}</strong>

                      <span>
                        {candidate.professionalCategory}
                        {candidate.professionalSubCategory ? ` | ${candidate.professionalSubCategory}` : ""}
                      </span>

                      {candidate.hasActiveDesignation ? (
                        <small>כבר מוגדר כמנהל פעיל</small>
                      ) : candidate.hasInactiveDesignation ? (
                        <small>הגדרה לא פעילה קיימת. הבחירה תפעיל מחדש.</small>
                      ) : null}
                    </div>
                  </label>
                );
              })}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={saving}
            >
              ביטול
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={!selectedEmployeeId || saving}
            >
              {saving ? "שומר..." : "שמירה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
