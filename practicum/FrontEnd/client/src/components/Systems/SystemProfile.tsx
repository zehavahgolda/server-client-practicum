import type { SystemDetails } from "../../types";
import "./SystemProfile.css";

interface SystemProfileProps {
  system: SystemDetails;
  loading?: boolean;
  onBack: () => void;
  onOpenAssign: () => void;
  onOpenEdit: () => void;
}

function getTone(gap: number) {
  if (gap > 0) return "shortage";
  if (gap < 0) return "excess";
  return "balanced";
}

function getStatusLabel(gap: number) {
  if (gap > 0) return "Shortage";
  if (gap < 0) return "Excess";
  return "Balanced";
}

export default function SystemProfile({
  system,
  loading = false,
  onBack,
  onOpenAssign,
  onOpenEdit
}: SystemProfileProps) {
  const tone = getTone(system.gap);
  const firstLetter = system.name?.charAt(0) || "מ";

  return (
    <section className="system-profile-page" dir="rtl">
      <header className="system-profile-header">
        <div>
          <div className="system-profile-eyebrow">סביבת ניהול מערכת</div>
          <h1>{system.name}</h1>
          <p>
            מצב: {getStatusLabel(system.gap)} | עובדים משויכים:{" "}
            {system.assignedEmployeesCount}
          </p>

          <div className="system-profile-tags">
            <span className={`system-status-pill ${tone}`}>
              {getStatusLabel(system.gap)}
            </span>
            <span className="system-soft-pill">פער קיבולת: {Math.abs(system.gap)}</span>
          </div>
        </div>

        <div className="system-profile-avatar">{firstLetter}</div>
      </header>

      <div className="system-profile-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          חזרה לרשימה
        </button>

        <button type="button" className="primary-btn" onClick={onOpenEdit}>
          עריכת מערכת
        </button>

        <button type="button" className="secondary-btn" onClick={onOpenAssign}>
          + שיבוץ עובדים
        </button>
      </div>

      {loading && <div className="system-note-box">טוען פרטי מערכת...</div>}

      {system.managementNote && <div className="system-note-box">{system.managementNote}</div>}

      <div className="system-profile-kpis">
        <div className="system-profile-kpi">
          <span>נדרש</span>
          <strong>{system.requiredCapacityMonths}</strong>
        </div>

        <div className="system-profile-kpi">
          <span>מוקצה</span>
          <strong>{system.allocatedMonths}</strong>
        </div>

        <div className="system-profile-kpi">
          <span>פער</span>
          <strong className={tone}>{Math.abs(system.gap)}</strong>
        </div>

        <div className="system-profile-kpi">
          <span>עובדים משויכים</span>
          <strong>{system.assignedEmployeesCount}</strong>
        </div>
      </div>

      <div className="system-profile-content">
        <section className="system-profile-panel employees-panel">
          <h2>הקצאות עובדים</h2>

          {system.assignedEmployees.length === 0 ? (
            <p className="empty-text">אין עובדים משויכים למערכת זו.</p>
          ) : (
            <div className="assigned-employees-list">
              {system.assignedEmployees.map((employee) => (
                <div className="assigned-employee-row" key={employee.employeeId}>
                  <div>
                    <strong>{employee.fullName}</strong>
                    <span>
                      {employee.actualMonths} חודשי עבודה | {employee.professionalCategory}
                      {employee.professionalSubCategory
                        ? ` | ${employee.professionalSubCategory}`
                        : ""}
                    </span>
                  </div>

                  <button type="button" className="small-outline-btn">
                    פתיחת עובד
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="system-profile-panel insight-panel">
          <h2>תמונת ניהול</h2>

          <div className="system-note-box">
            {system.gap > 0
              ? "קיים מחסור שעדיין ניתן לאיזון באמצעות העברת קיבולת."
              : system.gap < 0
                ? "קיים עודף קיבולת במערכת זו."
                : "המערכת מאוזנת מבחינת קיבולת."}
          </div>

          <div className="system-profile-tags centered">
            <span className="system-soft-pill">סטטוס: {getStatusLabel(system.gap)}</span>
            <span className="system-soft-pill">פער: {Math.abs(system.gap)}</span>
          </div>

          <h3>שינויים רלוונטיים</h3>

          {system.changes.length === 0 ? (
            <p className="empty-text">אין שינויים משויכים כרגע למערכת זו.</p>
          ) : (
            <div className="changes-list">
              {system.changes.map((change, index) => (
                <div className="change-row" key={`${change.date}-${index}`}>
                  <strong>{change.title}</strong>
                  <span>{change.impact}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}