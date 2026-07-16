import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";

import { useCategories } from "../../../hooks/useCategories";
import { categoryService } from "../../../services/categoryService";

import type { CategoryDto } from "../../../types";

import ProfessionalCategoryDeactivateDialog from "./ProfessionalCategoryDeactivateDialog";
import ProfessionalCategoryFormModal from "./ProfessionalCategoryFormModal";

interface ProfessionalCategoriesSectionProps {
  onReturnHome: () => void;
}

export default function ProfessionalCategoriesSection({
  onReturnHome
}: ProfessionalCategoriesSectionProps) {
  const { categories, loading, error, reloadCategories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CategoryDto | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  function toHebrewCategoryError(error: unknown): string {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("already exists")) {
      return "שם הקטגוריה כבר קיים במערכת";
    }

    if (message.includes("required")) {
      return "יש להזין שם קטגוריה";
    }

    return "אירעה שגיאה בשמירת הקטגוריה";
  }

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, searchTerm]);

  function openCreateModal() {
    setSelectedCategory(null);
    setModalMode("create");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(category: CategoryDto) {
    setSelectedCategory(category);
    setModalMode("edit");
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(name: string) {
    setFormSaving(true);
    setFormError(null);

    try {
      if (modalMode === "create") {
        await categoryService.createCategory({ name });
      } else if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, { name });
      }

      await reloadCategories();
      setModalOpen(false);
    } catch (err) {
      setFormError(toHebrewCategoryError(err));
      throw err;
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) {
      return;
    }

    setDeactivateSaving(true);

    try {
      await categoryService.deleteCategory(deactivateTarget.id);
      await reloadCategories();
      setDeactivateTarget(null);
    } finally {
      setDeactivateSaving(false);
    }
  }

  return (
    <section className="panel management-section-shell">
      <div className="management-section-topline">
        <div className="management-section-heading">
          <h2>קטגוריות מקצועיות</h2>
          <p>ניהול תחומי המקצוע הזמינים לעובדים במערכת</p>
        </div>

        <button type="button" className="management-return-home" onClick={onReturnHome}>
          חזרה למסכי ניהול
        </button>
      </div>

      <div className="management-reserved-toolbar">
        <label className="management-reserved-field" htmlFor="professional-categories-search">
          חיפוש קטגוריה
        </label>

        <div className="management-search-input-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            id="professional-categories-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="חיפוש לפי שם קטגוריה"
          />
        </div>

        <button type="button" className="primary-btn" onClick={openCreateModal}>
          <Plus size={16} aria-hidden="true" />
          הוספת קטגוריה
        </button>
      </div>

      {loading ? (
        <div className="management-inline-state" role="status" aria-live="polite">
          טוען קטגוריות מקצועיות...
        </div>
      ) : null}

      {error ? <div className="management-error-box">{error}</div> : null}

      {!loading && !error && filteredCategories.length === 0 && (
        <div className="management-empty-state">
          <div className="management-empty-state-icon" aria-hidden="true">
            <Search size={22} />
          </div>
          <p>{searchTerm.trim() ? "לא נמצאו קטגוריות התואמות לחיפוש" : "אין קטגוריות מקצועיות להצגה"}</p>
          <small>
            {searchTerm.trim()
              ? "אפשר לנסות ביטוי חיפוש אחר"
              : "ניתן להתחיל בלחיצה על הוספת קטגוריה"}
          </small>
        </div>
      )}

      {!loading && !error && filteredCategories.length > 0 && (
        <div className="professional-categories-list" role="list" aria-label="רשימת קטגוריות מקצועיות">
          {filteredCategories.map((category) => (
            <div key={category.id} className="professional-category-row" role="listitem">
              <div className="professional-category-name">{category.name}</div>

              <div className="professional-category-actions">
                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => openEditModal(category)}
                  title="עריכה"
                  aria-label={`עריכת ${category.name}`}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => setDeactivateTarget(category)}
                  title="השבתה"
                  aria-label={`השבתת ${category.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfessionalCategoryFormModal
        open={modalOpen}
        initialName={selectedCategory?.name ?? ""}
        mode={modalMode}
        saving={formSaving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProfessionalCategoryDeactivateDialog
        open={Boolean(deactivateTarget)}
        saving={deactivateSaving}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </section>
  );
}
