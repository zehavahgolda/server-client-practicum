using HR_System.DTOs.Categories;

namespace HR_System.Services
{
    public interface ICategoryService
    {
        Task<List<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto?> GetCategoryDtoByIdAsync(string id);
        Task<CategoryDto> CreateCategoryAsync(CategoryCreateDto dto);
        Task<CategoryDto?> UpdateCategoryAsync(string id, CategoryUpdateDto dto);
        Task<bool> SoftDeleteCategoryAsync(string id);
        Task<CategoryBootstrapAnalysisReportDto> AnalyzeEmployeeCategoryBootstrapAsync();
        Task<CategoryBootstrapExecuteResultDto> ExecuteApprovedCategoryBootstrapAsync(CategoryBootstrapExecuteRequestDto request);
        Task<List<CategorySubcategoryDto>> GetSubcategoriesAsync(string? search = null, string? parentCategoryId = null);
        Task<CategorySubcategoryMutationResult> CreateSubcategoryAsync(CategorySubcategoryCreateDto dto);
        Task<CategorySubcategoryMutationResult> UpdateSubcategoryAsync(string subcategoryId, CategorySubcategoryUpdateDto dto);
        Task<CategorySubcategoryMutationResult> DeactivateSubcategoryAsync(string subcategoryId);
    }
}