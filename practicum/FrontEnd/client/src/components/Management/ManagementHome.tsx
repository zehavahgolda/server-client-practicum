import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ListTree,
  UsersRound
} from "lucide-react";

import type {
  ManagementSection,
  ManagementSectionId,
} from "../../pages/CategoriesPage/CategoriesPage";

interface ManagementHomeProps {
  sections: readonly ManagementSection[];
  onSelectSection: (sectionId: ManagementSectionId) => void;
}

function getSectionIcon(sectionId: ManagementSectionId) {
  const iconProps = { size: 22, strokeWidth: 1.9, "aria-hidden": true };

  switch (sectionId) {
    case "categories":
      return <BriefcaseBusiness {...iconProps} />;
    case "subcategories":
      return <ListTree {...iconProps} />;
    case "managers":
      return <UsersRound {...iconProps} />;
    case "organization-events":
      return <CalendarDays {...iconProps} />;
  }
}

export default function ManagementHome({
  sections,
  onSelectSection
}: ManagementHomeProps) {
  return (
    <section className="management-home-grid" aria-label="אזורי ניהול">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className="management-area-card"
          onClick={() => onSelectSection(section.id)}
        >
          <span className="management-area-icon">
            {getSectionIcon(section.id)}
          </span>

          <span className="management-area-copy">
            <h2>{section.label}</h2>
            <p>{section.description}</p>
          </span>

          <span className="management-card-action" aria-hidden="true">
            <span className="management-card-action-label">לניהול</span>
            <ChevronLeft size={20} strokeWidth={2} />
          </span>
        </button>
      ))}
    </section>
  );
}
