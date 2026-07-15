import { useNavigate } from "react-router-dom";

import type { SystemDetails } from "../../../types";
import { formatCurrency } from "../../../utils/numberFormatters";

import "./SystemProfile.css";

// מאפייני מסך פרופיל מערכת.
interface SystemProfileProps {
  system: SystemDetails;
  loading?: boolean;
  onBack: () => void;
  onOpenAssign: () => void;
  onOpenEdit: () => void;
}

type SystemTone =
  | "shortage"
  | "excess"
  | "balanced";

// קובע טון תצוגה לפי פער הקיבולת של המערכת.
function getTone(gap: number): SystemTone {
  if (gap > 0) {
    return "shortage";
  }

  if (gap < 0) {
    return "excess";
  }

  return "balanced";
}

// מחזיר תווית סטטוס ברורה בעברית.
function getStatusLabel(gap: number) {
  if (gap > 0) {
    return "במחסור";
  }

  if (gap < 0) {
    return "בעודף";
  }

  return "מאוזנת";
}

// מחזיר הסבר ניהולי לפי פער הקיבולת.
function getManagementSummary(gap: number) {
  if (gap > 0) {
    return "קיים מחסור בקיבולת. מומלץ לבחון שיבוץ עובדים נוספים או העברת קיבולת ממערכות אחרות.";
  }

  if (gap < 0) {
    return "קיים עודף קיבולת. ניתן לבחון העברת משאבים למערכות שבהן קיים מחסור.";
  }

  return "המערכת מאוזנת מבחינת הקיבולת המתוכננת והקיבולת המוקצית.";
}

// מחשב אחוז ניצול תקציב להצגת פס התקדמות תקציבי.
function getBudgetUsagePercent(system: SystemDetails) {
  if (
    !system.allocatedBudget ||
    system.allocatedBudget <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (system.usedBudget /
        system.allocatedBudget) *
        100
    )
  );
}

// מציג מסך פרופיל מערכת מלא עם תקציב,
// קיבולת, הקצאות ותובנות ניהול.
export default function SystemProfile({
  system,
  loading = false,
  onBack,
  onOpenAssign,
  onOpenEdit
}: SystemProfileProps) {
  const navigate = useNavigate();

  const tone = getTone(system.gap);
  const statusLabel = getStatusLabel(system.gap);
  const firstLetter =
    system.name?.trim().charAt(0) || "מ";

  const budgetUsagePercent =
    getBudgetUsagePercent(system);

  const budgetTone =
    system.budgetGap < 0
      ? "shortage"
      : "balanced";

  return (
    <div
      className="modal-overlay system-profile-modal-overlay"
      onClick={onBack}
    >
      <div
        className="modal-card system-profile-modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onBack}
          aria-label="סגירת פרופיל מערכת"
        >
          ×
        </button>

        <section
          className="system-profile-page"
          dir="rtl"
        >
          <header className="system-profile-header">
            <div className="system-profile-heading">
              <div className="system-profile-avatar">
                {firstLetter}
              </div>

              <div className="system-profile-title-area">
                <span className="system-profile-eyebrow">
                  סביבת ניהול מערכת
                </span>

                <div className="system-profile-title-row">
                  <h1>{system.name}</h1>

                  <span
                    className={`system-status-pill ${tone}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <p>
                  {system.assignedEmployeesCount} עובדים
                  משויכים
                  <span
                    className="system-profile-meta-separator"
                    aria-hidden="true"
                  >
                    •
                  </span>
                  פער קיבולת:{" "}
                  <strong>
                    {Math.abs(system.gap)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="system-profile-actions">
              <button
                type="button"
                className="secondary-btn system-profile-action"
                onClick={onBack}
              >
                חזרה לרשימה
              </button>

              <button
                type="button"
                className="primary-btn system-profile-action"
                onClick={onOpenEdit}
              >
                עריכת מערכת
              </button>

              <button
                type="button"
                className="secondary-btn system-profile-action"
                onClick={onOpenAssign}
              >
                + שיבוץ עובדים
              </button>
            </div>
          </header>

          {loading && (
            <div className="system-note-box">
              טוען פרטי מערכת...
            </div>
          )}

          {system.managementNote && (
            <div className="system-note-box">
              {system.managementNote}
            </div>
          )}

          <section className="system-profile-kpis">
            <div className="system-profile-kpi">
              <span>קיבולת נדרשת</span>
              <strong>
                {system.requiredCapacityMonths}
              </strong>
            </div>

            <div className="system-profile-kpi">
              <span>קיבולת מוקצית</span>
              <strong>
                {system.allocatedMonths}
              </strong>
            </div>

            <div className="system-profile-kpi">
              <span>
                {system.gap > 0
                  ? "מחסור"
                  : system.gap < 0
                    ? "עודף"
                    : "פער"}
              </span>

              <strong className={tone}>
                {Math.abs(system.gap)}
              </strong>
            </div>

            <div className="system-profile-kpi">
              <span>עובדים משויכים</span>
              <strong>
                {system.assignedEmployeesCount}
              </strong>
            </div>
          </section>

          <section className="system-budget-panel">
            <div className="system-budget-header">
              <div>
                <h2>תמונת מצב תקציבית</h2>

                <p>
                  תקציב מוקצה, שימוש בפועל ויתרה
                  נוכחית.
                </p>
              </div>

              <span
                className={`system-budget-status ${budgetTone}`}
              >
                {system.budgetGap < 0
                  ? "חריגה תקציבית"
                  : "תקציב תקין"}
              </span>
            </div>

            <div className="system-budget-content">
              <div className="system-budget-kpis">
                <div className="system-budget-kpi">
                  <span>הוקצה</span>

                  <strong>
                    {formatCurrency(
                      system.allocatedBudget
                    )}
                  </strong>
                </div>

                <div className="system-budget-kpi">
                  <span>שימוש בפועל</span>

                  <strong>
                    {formatCurrency(
                      system.usedBudget
                    )}
                  </strong>
                </div>

                <div className="system-budget-kpi">
                  <span>
                    {system.budgetGap < 0
                      ? "חריגה"
                      : "יתרה"}
                  </span>

                  <strong className={budgetTone}>
                    {formatCurrency(
                      Math.abs(system.budgetGap)
                    )}
                  </strong>
                </div>
              </div>

              <div className="system-budget-progress">
                <div className="system-budget-progress-label">
                  <span>ניצול תקציב</span>

                  <strong>
                    {budgetUsagePercent}%
                  </strong>
                </div>

                <div className="system-budget-track">
                  <div
                    className={`system-budget-fill ${budgetTone}`}
                    style={{
                      width: `${budgetUsagePercent}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="system-profile-content">
            <section className="system-profile-panel employees-panel">
              <div className="system-profile-panel-header">
                <div>
                  <h2>הקצאות עובדים</h2>

                  <p>
                    העובדים המשויכים למערכת
                    והקצאת חודשי העבודה שלהם.
                  </p>
                </div>

                <span className="system-profile-panel-count">
                  {system.assignedEmployees.length}
                </span>
              </div>

              {system.assignedEmployees.length ===
              0 ? (
                <p className="empty-text">
                  אין עובדים משויכים למערכת זו.
                </p>
              ) : (
                <div className="assigned-employees-list">
                  {system.assignedEmployees.map(
                    (employee) => (
                      <div
                        className="assigned-employee-row"
                        key={employee.employeeId}
                      >
                        <div className="assigned-employee-details">
                          <strong>
                            {employee.fullName}
                          </strong>

                          <span>
                            {employee.actualMonths} חודשי
                            עבודה
                          </span>

                          <small>
                            {
                              employee.professionalCategory
                            }

                            {employee.professionalSubCategory
                              ? ` | ${employee.professionalSubCategory}`
                              : ""}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="small-outline-btn"
                          onClick={() =>
                            navigate(
                              `/employees?employeeId=${employee.employeeId}`
                            )
                          }
                        >
                          פתיחת עובד
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="system-profile-panel insight-panel">
              <div className="system-profile-panel-header">
                <div>
                  <h2>תמונת ניהול</h2>

                  <p>
                    תובנות ושינויים הדורשים תשומת
                    לב.
                  </p>
                </div>
              </div>

              <div
                className={`system-management-summary ${tone}`}
              >
                <span
                  className={`system-management-indicator ${tone}`}
                />

                <p>
                  {getManagementSummary(system.gap)}
                </p>
              </div>

              <h3>שינויים רלוונטיים</h3>

              {system.changes.length === 0 ? (
                <p className="empty-text">
                  אין שינויים משויכים כרגע למערכת
                  זו.
                </p>
              ) : (
                <div className="changes-list">
                  {system.changes.map(
                    (change, index) => (
                      <div
                        className="change-row"
                        key={`${change.date}-${index}`}
                      >
                        <strong>
                          {change.title}
                        </strong>

                        <span>
                          {change.impact}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}