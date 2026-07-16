import type {
  ManagementSection,
  ManagementSectionId,
} from "../../pages/CategoriesPage/CategoriesPage";

interface ManagementSectionPlaceholderProps {
  section: ManagementSection;
  onReturnHome: () => void;
}

function getSearchLabel(sectionId: ManagementSectionId) {
  return sectionId === "managers" ? "חיפוש עובד" : "חיפוש";
}

export default function ManagementSectionPlaceholder({
  section,
  onReturnHome
}: ManagementSectionPlaceholderProps) {
  return (
    <section className="panel management-section-shell">
      <div className="management-section-topline">
        <div className="management-section-heading">
          <h2>{section.label}</h2>
          <p>{section.sectionSubtitle}</p>
        </div>

        <button
          type="button"
          className="management-return-home"
          onClick={onReturnHome}
        >
          חזרה למסכי ניהול
        </button>
      </div>

      <div className="management-reserved-toolbar" aria-label="פעולות שמורות">
        <label className="management-reserved-field">
          {getSearchLabel(section.id)}
          <input readOnly placeholder={section.searchPlaceholder} />
        </label>

        {section.filterLabel ? (
          <label className="management-reserved-field">
            {section.filterLabel}
            <select disabled defaultValue="">
              <option value="">בחירה תהיה זמינה בהמשך</option>
            </select>
          </label>
        ) : null}

        <button
          type="button"
          className="management-upcoming-action"
          disabled
          title="פעולה זו תתווסף בשלב הבא"
        >
          {section.actionLabel} · בקרוב
        </button>
      </div>

      <div className="management-empty-state">
        <p>{section.emptyMessage}</p>
      </div>
    </section>
  );
}
