import { useNavigate } from "react-router-dom";
import type { EmployeeDetails } from "../../types";
import "./EmployeeProfile.css";

// מאפייני קומפוננטת פרופיל עובד.
interface Props {
  employee: EmployeeDetails;
}

// קובע טון תצוגה לפי יתרת קיבולת העובד.
function getAvailabilityTone(employee: EmployeeDetails) {
  if (employee.remainingMonths < 0) return "overloaded";
  if (employee.remainingMonths === 0) return "balanced";
  return "available";
}

// מחזיר תווית סטטוס זמינות קריאה למשתמש.
function getAvailabilityLabel(employee: EmployeeDetails) {
  if (employee.remainingMonths < 0) return "עומס יתר";
  if (employee.remainingMonths === 0) return "זמינות מלאה";
  return "זמינות תקינה";
}

// מחלץ אות ראשונה לשימוש באווטאר העובד.
function getEmployeeInitial(name: string) {
  return name.trim().charAt(0) || "ע";
}

// מציג מסך פרופיל עובד מלא עם מדדים, שיבוצים ותמונת ניהול.
export default function EmployeeProfile({ employee }: Props) {
  const navigate = useNavigate();
  const tone = getAvailabilityTone(employee);

  return (
    <article className="employee-profile-card" dir="rtl">
      <header className="employee-profile-hero">
        <div className="employee-profile-avatar">
          {getEmployeeInitial(employee.fullName)}
        </div>

        <div className="employee-profile-title-block">
          <span className="employee-profile-kicker">סביבת ניהול עובד</span>
          <h2>{employee.fullName}</h2>

          <p>
            {employee.professionalCategory}
            {employee.professionalSubCategory ? ` | ${employee.professionalSubCategory}` : ""}
            {" | "}
            מנהל: {employee.managerName}
          </p>

          <div className="employee-profile-tags">
            <span className={`employee-profile-status ${tone}`}>
              {getAvailabilityLabel(employee)}
            </span>

            {employee.upcomingEvent && (
              <span className="employee-profile-event">
                אירוע עתידי: {employee.upcomingEvent}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className={`employee-profile-note ${tone}`}>
        {employee.remainingMonths < 0
          ? "העובד בעומס יתר ודורש איזון שיבוצים מיידי."
          : employee.remainingMonths === 0
            ? "העובד מנוצל באופן מלא, אין קיבולת פנויה נוספת."
            : "העובד זמין יחסית ויכול לשמש כיעד לאיזון עומסים."}
      </div>

      <section className="employee-profile-metrics">
        <div className="employee-profile-metric">
          <span>קיבולת שנתית</span>
          <strong>{employee.yearlyCapacityMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>מנוצל</span>
          <strong>{employee.allocatedMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>יתרה</span>
          <strong className={tone}>{employee.remainingMonths}</strong>
        </div>

        <div className="employee-profile-metric">
          <span>מערכות פעילות</span>
          <strong>{employee.assignedSystemsCount}</strong>
        </div>
      </section>

      <section className="employee-profile-content-grid">
        <div className="employee-profile-panel">
          {/* רשימת שיבוצים פעילים וקישור מהיר למערכת משויכת */}
          <h3>שיבוצים פעילים</h3>

          <div className="employee-profile-allocations">
            {employee.allocations.length === 0 && (
              <div className="employee-profile-empty">
                אין שיבוצים פעילים לעובד זה.
              </div>
            )}

            {employee.allocations.map((allocation) => (
              <div
                key={`${allocation.systemId}-${allocation.roleInSystem}`}
                className="employee-profile-allocation"
              >
                <div>
                  <strong>{allocation.systemName}</strong>
                  <span>{allocation.actualMonths} חודשי עבודה מתוכננים</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/systems?systemId=${allocation.systemId}`)}
                >
                  פתיחת מערכת
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="employee-profile-panel manager-panel">
          {/* אזור בקרה ניהולי עם הערות ותובנה תפעולית */}
          <h3>נקודות בקרה למנהל</h3>

          <div className="employee-profile-manager-note">
            {employee.managerReviewNote || employee.notes || "אין הערת מנהל כרגע לעובד זה."}
          </div>

          <div className="employee-profile-mini-tags">
            <span>מנהל: {employee.managerName}</span>
            <span>תחום: {employee.professionalSubCategory || employee.professionalCategory}</span>
          </div>

          <h4>שינויים רלוונטיים</h4>

          <div className="employee-profile-change">
            <strong>
              {employee.remainingMonths < 0
                ? `עומס ${employee.professionalSubCategory || employee.professionalCategory} יצא להיעדרות`
                : `${employee.professionalSubCategory || employee.professionalCategory} זמין לשיבוץ נוסף`}
            </strong>
            <span>
              {employee.remainingMonths < 0
                ? "חסר צפוי ויש לבחון העברת עומסים."
                : "ניתן לשקול שיוך נוסף לפי צורך."}
            </span>
          </div>
        </aside>
      </section>
    </article>
  );
}
