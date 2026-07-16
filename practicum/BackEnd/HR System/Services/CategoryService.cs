using HR_System.DTOs.Categories;
using HR_System.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace HR_System.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IMongoCollection<Category> _categoriesCollection;
        private readonly IMongoCollection<Employee> _employeesCollection;

        public CategoryService(IMongoDatabase database)
        {
            _categoriesCollection = database.GetCollection<Category>("Categories");
            _employeesCollection = database.GetCollection<Employee>("employees");
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

        public async Task<List<CategorySubcategoryDto>> GetSubcategoriesAsync(string? search = null, string? parentCategoryId = null)
        {
            var categories = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .SortBy(category => category.Name)
                .ToListAsync();

            var normalizedSearch = Normalize(search);
            var normalizedParentCategoryId = parentCategoryId?.Trim();

            var rows = categories
                .Where(category =>
                    string.IsNullOrWhiteSpace(normalizedParentCategoryId) ||
                    string.Equals(category.Id, normalizedParentCategoryId, StringComparison.OrdinalIgnoreCase))
                .SelectMany(category =>
                    (category.Subcategories ?? new List<CategorySubcategory>())
                        .Where(subcategory => !subcategory.IsDeleted)
                        .Select(subcategory => new CategorySubcategoryDto
                        {
                            Id = subcategory.Id,
                            Name = subcategory.Name,
                            ParentCategoryId = category.Id!,
                            ParentCategoryName = category.Name
                        }))
                .Where(dto =>
                    string.IsNullOrWhiteSpace(normalizedSearch) ||
                    Normalize(dto.Name).Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase))
                .OrderBy(dto => dto.ParentCategoryName)
                .ThenBy(dto => dto.Name)
                .ToList();

            return rows;
        }

        public async Task<CategorySubcategoryMutationResult> CreateSubcategoryAsync(CategorySubcategoryCreateDto dto)
        {
            var parentCategory = await _categoriesCollection
                .Find(category => category.Id == dto.ParentCategoryId && !category.IsDeleted)
                .FirstOrDefaultAsync();

            if (parentCategory is null)
            {
                return new CategorySubcategoryMutationResult
                {
                    Found = false
                };
            }

            var normalizedName = dto.Name.Trim();

            if (HasDuplicateActiveSubcategoryName(parentCategory, normalizedName))
            {
                throw new InvalidOperationException("A subcategory with this name already exists in the selected category.");
            }

            var subcategory = new CategorySubcategory
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Name = normalizedName,
                IsDeleted = false
            };

            parentCategory.Subcategories ??= new List<CategorySubcategory>();
            parentCategory.Subcategories.Add(subcategory);

            await _categoriesCollection.ReplaceOneAsync(category => category.Id == parentCategory.Id, parentCategory);

            return new CategorySubcategoryMutationResult
            {
                Found = true,
                Subcategory = MapSubcategoryToDto(subcategory, parentCategory)
            };
        }

        public async Task<CategorySubcategoryMutationResult> UpdateSubcategoryAsync(string subcategoryId, CategorySubcategoryUpdateDto dto)
        {
            var categories = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .ToListAsync();

            var location = FindSubcategoryLocation(categories, subcategoryId);

            if (location.SourceCategory is null || location.Subcategory is null)
            {
                return new CategorySubcategoryMutationResult { Found = false };
            }

            var targetCategory = categories.FirstOrDefault(category =>
                string.Equals(category.Id, dto.ParentCategoryId, StringComparison.OrdinalIgnoreCase) && !category.IsDeleted);

            if (targetCategory is null)
            {
                return new CategorySubcategoryMutationResult { Found = false };
            }

            var normalizedNewName = dto.Name.Trim();
            var renameRequested = !string.Equals(
                Normalize(location.Subcategory.Name),
                Normalize(normalizedNewName),
                StringComparison.OrdinalIgnoreCase);

            var reparentRequested = !string.Equals(
                location.SourceCategory.Id,
                targetCategory.Id,
                StringComparison.OrdinalIgnoreCase);

            if ((renameRequested || reparentRequested) &&
                await TryBuildUsageConflictAsync(location.SourceCategory.Name, location.Subcategory.Name) is { } conflict)
            {
                return conflict;
            }

            if (HasDuplicateActiveSubcategoryName(targetCategory, normalizedNewName, subcategoryId))
            {
                throw new InvalidOperationException("A subcategory with this name already exists in the selected category.");
            }

            var categoryToPersist = location.SourceCategory;

            if (reparentRequested)
            {
                location.SourceCategory.Subcategories.RemoveAll(item =>
                    string.Equals(item.Id, subcategoryId, StringComparison.OrdinalIgnoreCase));

                targetCategory.Subcategories ??= new List<CategorySubcategory>();
                targetCategory.Subcategories.Add(new CategorySubcategory
                {
                    Id = location.Subcategory.Id,
                    Name = normalizedNewName,
                    IsDeleted = false
                });

                await _categoriesCollection.ReplaceOneAsync(category => category.Id == location.SourceCategory.Id, location.SourceCategory);
                await _categoriesCollection.ReplaceOneAsync(category => category.Id == targetCategory.Id, targetCategory);

                categoryToPersist = targetCategory;
                location.Subcategory = targetCategory.Subcategories.First(item =>
                    string.Equals(item.Id, subcategoryId, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                location.Subcategory.Name = normalizedNewName;

                await _categoriesCollection.ReplaceOneAsync(category => category.Id == location.SourceCategory.Id, location.SourceCategory);
            }

            return new CategorySubcategoryMutationResult
            {
                Found = true,
                Subcategory = MapSubcategoryToDto(location.Subcategory, categoryToPersist)
            };
        }

        public async Task<CategorySubcategoryMutationResult> DeactivateSubcategoryAsync(string subcategoryId)
        {
            var categories = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .ToListAsync();

            var location = FindSubcategoryLocation(categories, subcategoryId);

            if (location.SourceCategory is null || location.Subcategory is null)
            {
                return new CategorySubcategoryMutationResult { Found = false };
            }

            if (await TryBuildUsageConflictAsync(location.SourceCategory.Name, location.Subcategory.Name) is { } conflict)
            {
                return conflict;
            }

            location.Subcategory.IsDeleted = true;

            await _categoriesCollection.ReplaceOneAsync(category => category.Id == location.SourceCategory.Id, location.SourceCategory);

            return new CategorySubcategoryMutationResult
            {
                Found = true,
                Subcategory = MapSubcategoryToDto(location.Subcategory, location.SourceCategory)
            };
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

        private static bool HasDuplicateActiveSubcategoryName(Category category, string name, string? excludedSubcategoryId = null)
        {
            var normalized = Normalize(name);

            return (category.Subcategories ?? new List<CategorySubcategory>())
                .Any(subcategory =>
                    !subcategory.IsDeleted &&
                    !string.Equals(subcategory.Id, excludedSubcategoryId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(Normalize(subcategory.Name), normalized, StringComparison.OrdinalIgnoreCase));
        }

        private async Task<CategorySubcategoryMutationResult?> TryBuildUsageConflictAsync(string parentCategoryName, string subcategoryName)
        {
            var normalizedParent = Normalize(parentCategoryName);
            var normalizedSubcategory = Normalize(subcategoryName);

            var activeEmployees = await _employeesCollection
                .Find(employee => employee.IsActive)
                .ToListAsync();

            var affectedCount = activeEmployees.Count(employee =>
                string.Equals(Normalize(employee.ProfessionalCategory), normalizedParent, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(Normalize(employee.ProfessionalSubCategory), normalizedSubcategory, StringComparison.OrdinalIgnoreCase));

            if (affectedCount <= 0)
            {
                return null;
            }

            return new CategorySubcategoryMutationResult
            {
                Found = true,
                Conflict = true,
                AffectedEmployeesCount = affectedCount,
                ConflictMessage = $"לא ניתן לבצע פעולה זו כי {affectedCount} עובדים פעילים משויכים לתת־הקטגוריה בקטגוריה המקצועית שנבחרה."
            };
        }

        private static string Normalize(string? value)
        {
            return (value ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static CategorySubcategoryDto MapSubcategoryToDto(CategorySubcategory subcategory, Category category)
        {
            return new CategorySubcategoryDto
            {
                Id = subcategory.Id,
                Name = subcategory.Name,
                ParentCategoryId = category.Id!,
                ParentCategoryName = category.Name
            };
        }

        private static (Category? SourceCategory, CategorySubcategory? Subcategory) FindSubcategoryLocation(
            IEnumerable<Category> categories,
            string subcategoryId)
        {
            foreach (var category in categories)
            {
                var subcategory = (category.Subcategories ?? new List<CategorySubcategory>())
                    .FirstOrDefault(item =>
                        !item.IsDeleted &&
                        string.Equals(item.Id, subcategoryId, StringComparison.OrdinalIgnoreCase));

                if (subcategory is not null)
                {
                    return (category, subcategory);
                }
            }

            return (null, null);
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