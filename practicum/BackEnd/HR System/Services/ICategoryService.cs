using HR_System.Models;

namespace HR_System.Services
{
    public interface ICategoryService
    {
        Task<List<Category>> GetAllCategoriesAsync();
        Task<Category?> GetCategoryByIdAsync(string id);
        Task CreateCategoryAsync(Category category);
    }
}