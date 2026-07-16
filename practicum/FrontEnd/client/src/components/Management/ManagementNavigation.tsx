import type {
  ManagementSection,
  ManagementSectionId,
} from "../../pages/CategoriesPage/CategoriesPage";

interface ManagementNavigationProps {
  sections: readonly ManagementSection[];
  selectedSectionId: ManagementSectionId | null;
  onSelectSection: (sectionId: ManagementSectionId) => void;
}

export default function ManagementNavigation({
  sections,
  selectedSectionId,
  onSelectSection
}: ManagementNavigationProps) {
  return (
    <nav className="management-navigation" aria-label="ניווט במסכי ניהול">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`management-navigation-button ${
            selectedSectionId === section.id ? "active" : ""
          }`}
          aria-current={
            selectedSectionId === section.id ? "page" : undefined
          }
          onClick={() => onSelectSection(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
