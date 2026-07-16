import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";

import { useCategories } from "../../../hooks/useCategories";
import { useSubcategories } from "../../../hooks/useSubcategories";
import { subcategoryService } from "../../../services/subcategoryService";

import type { SubcategoryDto } from "../../../types";

import ProfessionalSubcategoryDeactivateDialog from "./ProfessionalSubcategoryDeactivateDialog";
import ProfessionalSubcategoryFormModal from "./ProfessionalSubcategoryFormModal";

interface ProfessionalSubcategoriesSectionProps {
  onReturnHome: () => void;
}

export default function ProfessionalSubcategoriesSection({
  onReturnHome
}: ProfessionalSubcategoriesSectionProps) {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
    reloadSubcategories
  } = useSubcategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryDto | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<SubcategoryDto | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  useEffect(() => {
    void reloadSubcategories({
      search: searchTerm.trim() || undefined,
      parentCategoryId: selectedCategoryId || undefined
    });
  }, [reloadSubcategories, searchTerm, selectedCategoryId]);

  const hasError = categoriesError || subcategoriesError;
  const combinedError = categoriesError || subcategoriesError;
  const loading = categoriesLoading || subcategoriesLoading;

  const activeCategories = useMemo(() => categories, [categories]);

  function toHebrewSubcategoryError(error: unknown): string {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("already exists")) {
      return "שם תת־הקטגוריה כבר קיים תחת הקטגוריה המקצועית שנבחרה";
    }

    if (message.includes("required")) {
      return "יש למלא את כל השדות הנדרשים";
    }

    if (message.includes("לא ניתן לבצע פעולה זו") || message.includes("409")) {
      return message || "לא ניתן לבצע פעולה זו כי תת־הקטגוריה בשימוש";
    }

    return "אירעה שגיאה בשמירת תת־הקטגוריה";
  }

  function openCreateModal() {
    setSelectedSubcategory(null);
    setModalMode("create");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(subcategory: SubcategoryDto) {
    setSelectedSubcategory(subcategory);
    setModalMode("edit");
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(payload: { name: string; parentCategoryId: string }) {
    setFormSaving(true);
    setFormError(null);

    try {
      if (modalMode === "create") {
        await subcategoryService.createSubcategory(payload);
      } else if (selectedSubcategory) {
        await subcategoryService.updateSubcategory(selectedSubcategory.id, payload);
      }

      await reloadSubcategories({
        search: searchTerm.trim() || undefined,
        parentCategoryId: selectedCategoryId || undefined
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(toHebrewSubcategoryError(err));
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
      await subcategoryService.deactivateSubcategory(deactivateTarget.id);
      await reloadSubcategories({
        search: searchTerm.trim() || undefined,
        parentCategoryId: selectedCategoryId || undefined
      });
      setDeactivateTarget(null);
    } catch (err) {
      setFormError(toHebrewSubcategoryError(err));
    } finally {
      setDeactivateSaving(false);
    }
  }

  const showFilteredEmpty = !loading && !hasError && subcategories.length === 0 && (searchTerm.trim() || selectedCategoryId);
  const showDefaultEmpty = !loading && !hasError && subcategories.length === 0 && !searchTerm.trim() && !selectedCategoryId;

  return (
    <section className="panel management-section-shell">
      <div className="management-section-topline">
        <div className="management-section-heading">
          <h2>תתי־קטגוריות מקצועיות</h2>
          <p>ניהול התמחויות ותפקידים תחת קטגוריות מקצועיות</p>
        </div>

        <button type="button" className="management-return-home" onClick={onReturnHome}>
          חזרה למסכי ניהול
        </button>
      </div>

      <div className="management-reserved-toolbar management-subcategories-toolbar">
        <label className="management-reserved-field" htmlFor="professional-subcategories-search">
          חיפוש תת־קטגוריה
        </label>

        <div className="management-search-input-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            id="professional-subcategories-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="חיפוש לפי שם תת־קטגוריה"
          />
        </div>

        <label className="management-reserved-field management-subcategories-filter" htmlFor="professional-subcategories-category-filter">
          סינון לפי קטגוריה
          <select
            id="professional-subcategories-category-filter"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            disabled={categoriesLoading || activeCategories.length === 0}
          >
            <option value="">כל הקטגוריות</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="primary-btn"
          onClick={openCreateModal}
          disabled={categoriesLoading || activeCategories.length === 0}
        >
          <Plus size={16} aria-hidden="true" />
          הוספת תת־קטגוריה
        </button>
      </div>

      {loading ? (
        <div className="management-inline-state" role="status" aria-live="polite">
          טוען תתי־קטגוריות מקצועיות...
        </div>
      ) : null}

      {combinedError ? <div className="management-error-box">{combinedError}</div> : null}

      {showDefaultEmpty ? (
        <div className="management-empty-state">
          <div className="management-empty-state-icon" aria-hidden="true">
            <Search size={22} />
          </div>
          <p>אין תתי־קטגוריות מקצועיות להצגה</p>
          <small>ניתן להתחיל בלחיצה על הוספת תת־קטגוריה</small>
        </div>
      ) : null}

      {showFilteredEmpty ? (
        <div className="management-empty-state">
          <div className="management-empty-state-icon" aria-hidden="true">
            <Search size={22} />
          </div>
          <p>לא נמצאו תתי־קטגוריות התואמות לסינון</p>
          <small>אפשר לנסות ביטוי חיפוש אחר או קטגוריה מקצועית אחרת</small>
        </div>
      ) : null}

      {!loading && !hasError && subcategories.length > 0 ? (
        <div className="management-subcategories-list" role="list" aria-label="רשימת תתי־קטגוריות מקצועיות">
          {subcategories.map((subcategory) => (
            <div key={subcategory.id} className="management-subcategories-row" role="listitem">
              <div className="management-subcategories-main">
                <div className="management-subcategories-name">{subcategory.name}</div>
                <div className="management-subcategories-parent">קטגוריה מקצועית: {subcategory.parentCategoryName}</div>
              </div>

              <div className="management-subcategories-actions">
                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => openEditModal(subcategory)}
                  title="עריכה"
                  aria-label={`עריכת ${subcategory.name}`}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  type="button"
                  className="management-icon-btn"
                  onClick={() => setDeactivateTarget(subcategory)}
                  title="השבתה"
                  aria-label={`השבתת ${subcategory.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ProfessionalSubcategoryFormModal
        open={modalOpen}
        mode={modalMode}
        categories={activeCategories}
        initialName={selectedSubcategory?.name ?? ""}
        initialParentCategoryId={selectedSubcategory?.parentCategoryId ?? selectedCategoryId}
        saving={formSaving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProfessionalSubcategoryDeactivateDialog
        open={Boolean(deactivateTarget)}
        saving={deactivateSaving}
        subcategoryName={deactivateTarget?.name ?? ""}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </section>
  );
}
