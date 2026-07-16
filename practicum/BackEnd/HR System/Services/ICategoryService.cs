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
    }
}