import { useSearchParams } from "react-router-dom";
import ManagementHome from "../../components/Management/ManagementHome";
import ManagementNavigation from "../../components/Management/ManagementNavigation";
import ManagementSectionPlaceholder from "../../components/Management/ManagementSectionPlaceholder";
import ProfessionalCategoriesSection from "../../components/Management/categories/ProfessionalCategoriesSection";
import OrganizationEventsSection from "../../components/Management/events/OrganizationEventsSection";
import ProfessionalSubcategoriesSection from "../../components/Management/subcategories/ProfessionalSubcategoriesSection";

import "./CategoriesPage.css";

export type ManagementSectionId =
  | "categories"
  | "subcategories"
  | "managers"
  | "organization-events";

export interface ManagementSection {
  id: ManagementSectionId;
  label: string;
  description: string;
  sectionSubtitle: string;
  emptyMessage: string;
  searchPlaceholder: string;
  actionLabel: string;
  filterLabel?: string;
}

export const managementSections: readonly ManagementSection[] = [
  {
    id: "categories",
    label: "קטגוריות מקצועיות",
    description: "ניהול תחומי המקצוע הזמינים לעובדים במערכת",
    sectionSubtitle: "ניהול תחומי המקצוע בארגון",
    emptyMessage: "ניהול הקטגוריות יתווסף בשלב הבא",
    searchPlaceholder: "חיפוש קטגוריה",
    actionLabel: "הוספת קטגוריה"
  },
  {
    id: "subcategories",
    label: "תתי־קטגוריות מקצועיות",
    description: "ניהול התמחויות ותפקידים תחת קטגוריות מקצועיות",
    sectionSubtitle: "ניהול התמחויות תחת קטגוריות מקצועיות",
    emptyMessage: "ניהול תתי־הקטגוריות יתווסף לאחר אישור מבנה הנתונים",
    searchPlaceholder: "חיפוש תת־קטגוריה",
    actionLabel: "הוספת תת־קטגוריה",
    filterLabel: "סינון לפי קטגוריה"
  },
  {
    id: "managers",
    label: "מנהלים",
    description: "ניהול רשימת המנהלים מתוך עובדי הארגון",
    sectionSubtitle: "ניהול רשימת המנהלים מתוך עובדי הארגון",
    emptyMessage: "ניהול המנהלים יתווסף בשלב הבא",
    searchPlaceholder: "חיפוש עובד",
    actionLabel: "הוספת מנהל"
  },
  {
    id: "organization-events",
    label: "אירועים כלל־ארגוניים",
    description: "ניהול אירועים רוחביים והיסטוריית אירועים ארגוניים",
    sectionSubtitle: "ניהול אירועים רוחביים שאינם שייכים לעובד יחיד",
    emptyMessage: "ניהול האירועים הכלל־ארגוניים יתווסף בשלב הבא",
    searchPlaceholder: "חיפוש אירוע",
    actionLabel: "הוספת אירוע",
    filterLabel: "מצב אירוע"
  }
];

function isManagementSectionId(
  value: string | null
): value is ManagementSectionId {
  return managementSections.some((section) => section.id === value);
}

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParameter = searchParams.get("section");
  const selectedSectionId = isManagementSectionId(sectionParameter)
    ? sectionParameter
    : null;
  const selectedSection = managementSections.find(
    (section) => section.id === selectedSectionId
  );

  function selectSection(sectionId: ManagementSectionId) {
    setSearchParams({ section: sectionId });
  }

  function returnHome() {
    setSearchParams({});
  }

  return (
    <main className="app-shell management-page" dir="rtl">
      <header className="app-header management-page-header">
        <h1>מסכי ניהול</h1>
        <p>ניהול הגדרות ארגוניות, מבנה מקצועי ואירועים רוחביים</p>
      </header>

      <ManagementNavigation
        sections={managementSections}
        selectedSectionId={selectedSectionId}
        onSelectSection={selectSection}
      />

      {selectedSection?.id === "categories" ? (
        <ProfessionalCategoriesSection onReturnHome={returnHome} />
      ) : selectedSection?.id === "subcategories" ? (
        <ProfessionalSubcategoriesSection onReturnHome={returnHome} />
      ) : selectedSection?.id === "organization-events" ? (
        <OrganizationEventsSection onReturnHome={returnHome} />
      ) : selectedSection ? (
        <ManagementSectionPlaceholder
          section={selectedSection}
          onReturnHome={returnHome}
        />
      ) : (
        <ManagementHome
          sections={managementSections}
          onSelectSection={selectSection}
        />
      )}
    </main>
  );
}