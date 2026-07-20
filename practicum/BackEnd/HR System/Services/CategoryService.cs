using HR_System.DTOs.Categories;
using HR_System.Models;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

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

        public async Task<CategoryBootstrapAnalysisReportDto> AnalyzeEmployeeCategoryBootstrapAsync()
        {
            var employees = await _employeesCollection
                .Find(employee => employee.IsActive)
                .ToListAsync();

            var categoryBuckets = new Dictionary<string, List<Employee>>(StringComparer.OrdinalIgnoreCase);

            foreach (var employee in employees)
            {
                var categoryRaw = employee.ProfessionalCategory?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(categoryRaw))
                {
                    continue;
                }

                var categoryKey = Normalize(categoryRaw);
                if (!categoryBuckets.ContainsKey(categoryKey))
                {
                    categoryBuckets[categoryKey] = new List<Employee>();
                }

                categoryBuckets[categoryKey].Add(employee);
            }

            var categories = new List<CategoryBootstrapCategoryCandidateDto>();
            var pairs = new Dictionary<string, CategoryBootstrapPairCandidateDto>(StringComparer.OrdinalIgnoreCase);
            var conflicts = new List<CategoryBootstrapConflictDto>();

            foreach (var bucket in categoryBuckets)
            {
                var categoryVariants = bucket.Value
                    .Select(employee => employee.ProfessionalCategory?.Trim() ?? string.Empty)
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .GroupBy(value => value)
                    .Select(group => new CategoryBootstrapVariantDto
                    {
                        Value = group.Key,
                        UsageCount = group.Count()
                    })
                    .OrderByDescending(variant => variant.UsageCount)
                    .ThenBy(variant => variant.Value)
                    .ToList();

                var categoryCanonical = ChooseCanonicalCandidate(categoryVariants);

                var subcategoryBuckets = bucket.Value
                    .Select(employee => employee.ProfessionalSubCategory?.Trim() ?? string.Empty)
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .GroupBy(value => Normalize(value))
                    .ToList();

                var subcategoryCandidates = new List<CategoryBootstrapSubcategoryCandidateDto>();

                foreach (var subBucket in subcategoryBuckets)
                {
                    var variants = subBucket
                        .GroupBy(value => value)
                        .Select(group => new CategoryBootstrapVariantDto
                        {
                            Value = group.Key,
                            UsageCount = group.Count()
                        })
                        .OrderByDescending(variant => variant.UsageCount)
                        .ThenBy(variant => variant.Value)
                        .ToList();

                    var subCanonical = ChooseCanonicalCandidate(variants);

                    subcategoryCandidates.Add(new CategoryBootstrapSubcategoryCandidateDto
                    {
                        CanonicalCandidate = subCanonical,
                        UsageCount = variants.Sum(variant => variant.UsageCount),
                        Variants = variants
                    });

                    var pairKey = $"{Normalize(categoryCanonical)}::{Normalize(subCanonical)}";
                    if (!pairs.TryGetValue(pairKey, out var pair))
                    {
                        pair = new CategoryBootstrapPairCandidateDto
                        {
                            CategoryCanonical = categoryCanonical,
                            SubcategoryCanonical = subCanonical,
                            UsageCount = 0
                        };

                        pairs[pairKey] = pair;
                    }

                    pair.UsageCount += variants.Sum(variant => variant.UsageCount);

                    var subCanonicalForms = variants
                        .Select(v => CanonicalShape(v.Value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    if (subCanonicalForms.Count > 1)
                    {
                        conflicts.Add(new CategoryBootstrapConflictDto
                        {
                            ConflictType = "subcategory-ambiguous",
                            ConflictKey = $"{categoryCanonical}::{subCanonical}",
                            CanonicalCandidates = variants.Select(v => v.Value).Distinct().ToList(),
                            Reason = "Multiple shape variants detected for subcategory; admin approval required."
                        });
                    }
                }

                var categoryCanonicalForms = categoryVariants
                    .Select(v => CanonicalShape(v.Value))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (categoryCanonicalForms.Count > 1)
                {
                    conflicts.Add(new CategoryBootstrapConflictDto
                    {
                        ConflictType = "category-ambiguous",
                        ConflictKey = categoryCanonical,
                        CanonicalCandidates = categoryVariants.Select(v => v.Value).Distinct().ToList(),
                        Reason = "Multiple shape variants detected for category; admin approval required."
                    });
                }

                categories.Add(new CategoryBootstrapCategoryCandidateDto
                {
                    CanonicalCandidate = categoryCanonical,
                    UsageCount = categoryVariants.Sum(variant => variant.UsageCount),
                    Variants = categoryVariants,
                    Subcategories = subcategoryCandidates
                        .OrderBy(sub => sub.CanonicalCandidate)
                        .ToList()
                });
            }

            var categoryAmbiguityGroups = categories
                .GroupBy(category => BuildAmbiguityKey(category.CanonicalCandidate))
                .Where(group => !string.IsNullOrWhiteSpace(group.Key) && group.Count() > 1)
                .ToList();

            foreach (var ambiguityGroup in categoryAmbiguityGroups)
            {
                conflicts.Add(new CategoryBootstrapConflictDto
                {
                    ConflictType = "category-ambiguity-group",
                    ConflictKey = ambiguityGroup.Key,
                    CanonicalCandidates = ambiguityGroup
                        .Select(category => category.CanonicalCandidate)
                        .Distinct()
                        .OrderBy(value => value)
                        .ToList(),
                    Reason = "Potentially equivalent category values detected (spacing/punctuation variation). Approval is required."
                });
            }

            foreach (var category in categories)
            {
                var subcategoryAmbiguityGroups = category.Subcategories
                    .GroupBy(subcategory => BuildAmbiguityKey(subcategory.CanonicalCandidate))
                    .Where(group => !string.IsNullOrWhiteSpace(group.Key) && group.Count() > 1)
                    .ToList();

                foreach (var ambiguityGroup in subcategoryAmbiguityGroups)
                {
                    conflicts.Add(new CategoryBootstrapConflictDto
                    {
                        ConflictType = "subcategory-ambiguity-group",
                        ConflictKey = $"{category.CanonicalCandidate}::{ambiguityGroup.Key}",
                        CanonicalCandidates = ambiguityGroup
                            .Select(subcategory => subcategory.CanonicalCandidate)
                            .Distinct()
                            .OrderBy(value => value)
                            .ToList(),
                        Reason = "Potentially equivalent subcategory values detected (spacing/punctuation variation). Approval is required."
                    });
                }
            }

            return new CategoryBootstrapAnalysisReportDto
            {
                GeneratedAtUtc = DateTime.UtcNow,
                EmployeesScanned = employees.Count,
                Categories = categories.OrderBy(category => category.CanonicalCandidate).ToList(),
                Pairs = pairs.Values
                    .OrderBy(pair => pair.CategoryCanonical)
                    .ThenBy(pair => pair.SubcategoryCanonical)
                    .ToList(),
                Conflicts = conflicts
                    .OrderBy(conflict => conflict.ConflictType)
                    .ThenBy(conflict => conflict.ConflictKey)
                    .ToList()
            };
        }

        public async Task<CategoryBootstrapExecuteResultDto> ExecuteApprovedCategoryBootstrapAsync(CategoryBootstrapExecuteRequestDto request)
        {
            var result = new CategoryBootstrapExecuteResultDto();

            if (request is null || request.ApprovedCategories is null)
            {
                return result;
            }

            var allCategories = await _categoriesCollection
                .Find(category => !category.IsDeleted)
                .ToListAsync();

            var categoriesByNormalizedName = allCategories
                .ToDictionary(category => Normalize(category.Name), category => category, StringComparer.OrdinalIgnoreCase);

            var approvedCategories = request.ApprovedCategories
                .Where(item => !string.IsNullOrWhiteSpace(item.CategoryName))
                .ToList();

            result.ApprovedCategoriesCount = approvedCategories.Count;
            result.ApprovedSubcategoriesCount = approvedCategories.Sum(category => (category.SubcategoryNames ?? new List<string>()).Count);

            foreach (var approvedCategory in approvedCategories)
            {
                var normalizedCategoryName = Normalize(approvedCategory.CategoryName);
                if (string.IsNullOrWhiteSpace(normalizedCategoryName))
                {
                    result.UnresolvedCategoriesCount++;
                    result.UnresolvedItems.Add("Category with empty normalized value was skipped.");
                    continue;
                }

                if (!categoriesByNormalizedName.TryGetValue(normalizedCategoryName, out var categoryEntity))
                {
                    categoryEntity = new Category
                    {
                        Name = approvedCategory.CategoryName.Trim(),
                        IsDeleted = false,
                        Subcategories = new List<CategorySubcategory>()
                    };

                    await _categoriesCollection.InsertOneAsync(categoryEntity);

                    categoriesByNormalizedName[normalizedCategoryName] = categoryEntity;

                    result.CreatedCategoriesCount++;
                    result.CreatedCategories.Add(categoryEntity.Name);
                }
                else
                {
                    result.SkippedCategoriesCount++;
                    result.SkippedCategories.Add(categoryEntity.Name);
                }

                var subcategoryNames = (approvedCategory.SubcategoryNames ?? new List<string>())
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Select(name => name.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (subcategoryNames.Count == 0)
                {
                    continue;
                }

                categoryEntity.Subcategories ??= new List<CategorySubcategory>();

                var existingSubcategories = categoryEntity.Subcategories
                    .Where(subcategory => !subcategory.IsDeleted)
                    .ToDictionary(subcategory => Normalize(subcategory.Name), subcategory => subcategory, StringComparer.OrdinalIgnoreCase);

                var createdAnySubcategory = false;

                foreach (var subcategoryName in subcategoryNames)
                {
                    var normalizedSubcategory = Normalize(subcategoryName);
                    if (existingSubcategories.ContainsKey(normalizedSubcategory))
                    {
                        result.SkippedSubcategoriesCount++;
                        result.SkippedSubcategories.Add($"{categoryEntity.Name}::{subcategoryName}");
                        continue;
                    }

                    var newSubcategory = new CategorySubcategory
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        Name = subcategoryName,
                        IsDeleted = false
                    };

                    categoryEntity.Subcategories.Add(newSubcategory);
                    existingSubcategories[normalizedSubcategory] = newSubcategory;

                    result.CreatedSubcategoriesCount++;
                    result.CreatedSubcategories.Add($"{categoryEntity.Name}::{subcategoryName}");
                    createdAnySubcategory = true;
                }

                if (createdAnySubcategory)
                {
                    await _categoriesCollection.ReplaceOneAsync(
                        category => category.Id == categoryEntity.Id,
                        categoryEntity);
                }
            }

            return result;
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

        private static string CanonicalShape(string value)
        {
            return Regex.Replace(value.Trim().ToLowerInvariant(), "\\s+", " ");
        }

        private static string BuildAmbiguityKey(string value)
        {
            var canonical = CanonicalShape(value);
            return Regex.Replace(canonical, "[^\\p{L}\\p{Nd}]", string.Empty);
        }

        private static string ChooseCanonicalCandidate(List<CategoryBootstrapVariantDto> variants)
        {
            return variants
                .OrderByDescending(variant => variant.UsageCount)
                .ThenBy(variant => variant.Value.Length)
                .ThenBy(variant => variant.Value)
                .FirstOrDefault()?.Value
                ?? string.Empty;
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