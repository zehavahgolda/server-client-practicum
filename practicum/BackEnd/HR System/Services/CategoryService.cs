using HR_System.DTOs.Categories;
using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IMongoCollection<Category> _categoriesCollection;

        public CategoryService(IMongoDatabase database)
        {
            _categoriesCollection = database.GetCollection<Category>("Categories");
        }

        public async Task<List<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .SortBy(category => category.Name)
                .ToListAsync();

            return categories.Select(MapToDto).ToList();
        }

        public async Task<CategoryDto?> GetCategoryDtoByIdAsync(string id)
        {
            var category = await _categoriesCollection
                .Find(category => category.Id == id && !category.IsDeleted)
                .FirstOrDefaultAsync();

            return category is null ? null : MapToDto(category);
        }

        public async Task<CategoryDto> CreateCategoryAsync(CategoryCreateDto dto)
        {
            var normalizedName = dto.Name.Trim();

            if (await HasDuplicateActiveNameAsync(normalizedName))
            {
                throw new InvalidOperationException("A category with this name already exists.");
            }

            var category = new Category
            {
                Name = normalizedName,
                IsDeleted = false
            };

            await _categoriesCollection.InsertOneAsync(category);

            return MapToDto(category);
        }

        public async Task<CategoryDto?> UpdateCategoryAsync(string id, CategoryUpdateDto dto)
        {
            var existingCategory = await _categoriesCollection
                .Find(category => category.Id == id && !category.IsDeleted)
                .FirstOrDefaultAsync();

            if (existingCategory is null)
            {
                return null;
            }

            var normalizedName = dto.Name.Trim();

            if (await HasDuplicateActiveNameAsync(normalizedName, id))
            {
                throw new InvalidOperationException("A category with this name already exists.");
            }

            existingCategory.Name = normalizedName;

            await _categoriesCollection.ReplaceOneAsync(
                category => category.Id == id,
                existingCategory
            );

            return MapToDto(existingCategory);
        }

        public async Task<bool> SoftDeleteCategoryAsync(string id)
        {
            var existingCategory = await _categoriesCollection
                .Find(category => category.Id == id && !category.IsDeleted)
                .FirstOrDefaultAsync();

            if (existingCategory is null)
            {
                return false;
            }

            var update = Builders<Category>.Update.Set(category => category.IsDeleted, true);

            var result = await _categoriesCollection.UpdateOneAsync(
                category => category.Id == id && !category.IsDeleted,
                update
            );

            return result.ModifiedCount > 0;
        }

        private async Task<bool> HasDuplicateActiveNameAsync(string name, string? excludedId = null)
        {
            var normalized = name.Trim().ToLowerInvariant();

            var candidates = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .ToListAsync();

            return candidates.Any(category =>
                category.Id != excludedId &&
                category.Name.Trim().ToLowerInvariant() == normalized);
        }

        private static CategoryDto MapToDto(Category category)
        {
            return new CategoryDto
            {
                Id = category.Id!,
                Name = category.Name
            };
        }
    }
}