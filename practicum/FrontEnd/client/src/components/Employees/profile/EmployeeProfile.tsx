import { useNavigate } from "react-router-dom";

import type { EmployeeDetails } from "../../../types";

import "./EmployeeProfile.css";

// מאפייני קומפוננטת פרופיל עובד.
interface EmployeeProfileProps {
  employee: EmployeeDetails;
  allocationOptionsCount: number;
  onClose: () => void;
  onEdit: () => void;
  onAddAllocation: () => void;
  onUpdateAllocation: () => void;
}

type EmployeeAvailabilityTone =
  | "available"
  | "balanced"
  | "overloaded";

// קובע טון תצוגה לפי יתרת קיבולת העובד.
function getAvailabilityTone(
  employee: EmployeeDetails
): EmployeeAvailabilityTone {
  if (employee.remainingMonths < 0) {
    return "overloaded";
  }

  if (employee.remainingMonths === 0) {
    return "balanced";
  }

  return "available";
}

// מחזיר תווית סטטוס זמינות קריאה למשתמש.
function getAvailabilityLabel(
  employee: EmployeeDetails
) {
  if (employee.remainingMonths < 0) {
    return "עומס יתר";
  }

  if (employee.remainingMonths === 0) {
    return "זמינות מלאה";
  }

  return "זמין לשיבוץ";
}

// מחזיר הסבר ניהולי לפי מצב הזמינות.
function getAvailabilitySummary(
  employee: EmployeeDetails
) {
  if (employee.remainingMonths < 0) {
    return "העובד נמצא בעומס יתר. מומלץ לבחון איזון שיבוצים או העברת חלק מהעבודה.";
  }

  if (employee.remainingMonths === 0) {
    return "העובד מנוצל במלוא הקיבולת השנתית ואין כרגע יתרה לשיבוץ נוסף.";
  }

  return "לעובד קיימת יתרת קיבולת וניתן לשקול שיבוץ נוסף בהתאם לצורכי המערכות.";
}

// מחלץ אות ראשונה לשימוש באווטאר העובד.
function getEmployeeInitial(name: string) {
  return name.trim().charAt(0) || "ע";
}

// מציג מסך פרופיל עובד עם מדדים, פעולות,
// שיבוצים ותמונת ניהול.
export default function EmployeeProfile({
  employee,
  allocationOptionsCount,
  onClose,
  onEdit,
  onAddAllocation,
  onUpdateAllocation
}: EmployeeProfileProps) {
  const navigate = useNavigate();

  const tone = getAvailabilityTone(employee);
  const availabilityLabel =
    getAvailabilityLabel(employee);

  const professionalArea =
    employee.professionalSubCategory ||
    employee.professionalCategory;

  return (
    <article
      className="employee-profile-card"
      dir="rtl"
    >
      <header className="employee-profile-hero">
        <div className="employee-profile-heading">
          <div className="employee-profile-avatar">
            {getEmployeeInitial(employee.fullName)}
          </div>

          <div className="employee-profile-title-block">
            <span className="employee-profile-kicker">
              סביבת ניהול עובד
            </span>

            <div className="employee-profile-title-row">
              <h2>{employee.fullName}</h2>

              <span
                className={`employee-profile-status ${tone}`}
              >
                {availabilityLabel}
              </span>
            </div>

            <p>
              {employee.professionalCategory}

              {employee.professionalSubCategory
                ? ` • ${employee.professionalSubCategory}`
                : ""}

              <span
                className="employee-profile-meta-separator"
                aria-hidden="true"
              >
                •
              </span>

              מנהל: {employee.managerName}
            </p>

            {employee.upcomingEvent && (
              <span className="employee-profile-event">
                אירוע עתידי: {employee.upcomingEvent}
              </span>
            )}
          </div>
        </div>

        <div className="employee-profile-actions">
          <button
            type="button"
            className="secondary-btn employee-profile-action"
            onClick={onClose}
          >
            סגירת פרופיל
          </button>

          <button
            type="button"
            className="secondary-btn employee-profile-action"
            onClick={onEdit}
          >
            עריכת עובד
          </button>

          <button
            type="button"
            className="primary-btn employee-profile-action"
            onClick={onAddAllocation}
          >
            + הוספת הקצאה
          </button>

          {allocationOptionsCount > 0 && (
            <button
              type="button"
              className="secondary-btn employee-profile-action"
              onClick={onUpdateAllocation}
            >
              עדכון חודשים
            </button>
          )}
        </div>
      </header>

      <div
        className={`employee-profile-note ${tone}`}
      >
        <span
          className={`employee-profile-note-indicator ${tone}`}
        />

        <p>{getAvailabilitySummary(employee)}</p>
      </div>

      <section className="employee-profile-metrics">
        <div className="employee-profile-metric">
          <span>קיבולת שנתית</span>

          <strong>
            {employee.yearlyCapacityMonths}
          </strong>
        </div>

        <div className="employee-profile-metric">
          <span>מוקצה</span>

          <strong>
            {employee.allocatedMonths}
          </strong>
        </div>

        <div className="employee-profile-metric">
          <span>יתרה</span>

          <strong className={tone}>
            {employee.remainingMonths}
          </strong>
        </div>

        <div className="employee-profile-metric">
          <span>מערכות פעילות</span>

          <strong>
            {employee.assignedSystemsCount}
          </strong>
        </div>
      </section>

      <section className="employee-profile-content-grid">
        <section className="employee-profile-panel">
          <div className="employee-profile-panel-header">
            <div>
              <h3>שיבוצים פעילים</h3>

              <p>
                המערכות שאליהן העובד משויך וחודשי
                העבודה שהוקצו לו.
              </p>
            </div>

            <span className="employee-profile-panel-count">
              {employee.allocations.length}
            </span>
          </div>

          <div className="employee-profile-allocations">
            {employee.allocations.length === 0 && (
              <div className="employee-profile-empty">
                אין שיבוצים פעילים לעובד זה.
              </div>
            )}

            {employee.allocations.map(
              (allocation) => (
                <div
                  key={`${allocation.systemId}-${allocation.roleInSystem}`}
                  className="employee-profile-allocation"
                >
                  <div className="employee-profile-allocation-details">
                    <strong>
                      {allocation.systemName}
                    </strong>

                    <span>
                      {allocation.actualMonths} חודשי
                      עבודה מתוכננים
                    </span>

                    {allocation.roleInSystem && (
                      <small>
                        תפקיד במערכת:{" "}
                        {allocation.roleInSystem}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/systems?systemId=${allocation.systemId}`
                      )
                    }
                  >
                    פתיחת מערכת
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        <aside className="employee-profile-panel manager-panel">
          <div className="employee-profile-panel-header">
            <div>
              <h3>נקודות בקרה למנהל</h3>

              <p>
                הערות, שיוך מקצועי ותובנות הדורשות
                תשומת לב.
              </p>
            </div>
          </div>

          <div className="employee-profile-manager-note">
            {employee.managerReviewNote ||
              employee.notes ||
              "אין הערת מנהל כרגע לעובד זה."}
          </div>

          <div className="employee-profile-mini-tags">
            <span>
              מנהל: {employee.managerName}
            </span>

            <span>
              תחום: {professionalArea}
            </span>
          </div>

          <h4>תובנה תפעולית</h4>

          <div
            className={`employee-profile-change ${tone}`}
          >
            <span
              className={`employee-profile-change-indicator ${tone}`}
            />

            <div>
              <strong>
                {employee.remainingMonths < 0
                  ? `נדרש איזון עומסים בתחום ${professionalArea}`
                  : employee.remainingMonths === 0
                    ? `${professionalArea} מנוצל במלואו`
                    : `${professionalArea} זמין לשיבוץ נוסף`}
              </strong>

              <span>
                {employee.remainingMonths < 0
                  ? "מומלץ לבדוק העברת עבודה או עדכון הקצאות."
                  : employee.remainingMonths === 0
                    ? "אין כרגע יתרת קיבולת נוספת."
                    : "ניתן לשקול שיוך למערכת נוספת לפי צורך."}
              </span>
            </div>
          </div>
        </aside>
      </section>
    </article>
  );
}