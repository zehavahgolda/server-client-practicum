namespace HR_System.DTOs.Categories
{
    public class CategoryBootstrapAnalysisReportDto
    {
        public DateTime GeneratedAtUtc { get; set; }
        public int EmployeesScanned { get; set; }
        public List<CategoryBootstrapCategoryCandidateDto> Categories { get; set; } = new();
        public List<CategoryBootstrapPairCandidateDto> Pairs { get; set; } = new();
        public List<CategoryBootstrapConflictDto> Conflicts { get; set; } = new();
    }

    public class CategoryBootstrapCategoryCandidateDto
    {
        public string CanonicalCandidate { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public List<CategoryBootstrapVariantDto> Variants { get; set; } = new();
        public List<CategoryBootstrapSubcategoryCandidateDto> Subcategories { get; set; } = new();
    }

    public class CategoryBootstrapSubcategoryCandidateDto
    {
        public string CanonicalCandidate { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public List<CategoryBootstrapVariantDto> Variants { get; set; } = new();
    }

    public class CategoryBootstrapVariantDto
    {
        public string Value { get; set; } = string.Empty;
        public int UsageCount { get; set; }
    }

    public class CategoryBootstrapPairCandidateDto
    {
        public string CategoryCanonical { get; set; } = string.Empty;
        public string SubcategoryCanonical { get; set; } = string.Empty;
        public int UsageCount { get; set; }
    }

    public class CategoryBootstrapConflictDto
    {
        public string ConflictType { get; set; } = string.Empty;
        public string ConflictKey { get; set; } = string.Empty;
        public List<string> CanonicalCandidates { get; set; } = new();
        public string Reason { get; set; } = string.Empty;
    }

    public class CategoryBootstrapExecuteRequestDto
    {
        public List<CategoryBootstrapApprovedCategoryDto> ApprovedCategories { get; set; } = new();
    }

    public class CategoryBootstrapApprovedCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public List<string> SubcategoryNames { get; set; } = new();
    }

    public class CategoryBootstrapExecuteResultDto
    {
        public int ApprovedCategoriesCount { get; set; }
        public int ApprovedSubcategoriesCount { get; set; }
        public int CreatedCategoriesCount { get; set; }
        public int SkippedCategoriesCount { get; set; }
        public int CreatedSubcategoriesCount { get; set; }
        public int SkippedSubcategoriesCount { get; set; }
        public int UnresolvedCategoriesCount { get; set; }
        public int UnresolvedSubcategoriesCount { get; set; }
        public List<string> CreatedCategories { get; set; } = new();
        public List<string> SkippedCategories { get; set; } = new();
        public List<string> CreatedSubcategories { get; set; } = new();
        public List<string> SkippedSubcategories { get; set; } = new();
        public List<string> UnresolvedItems { get; set; } = new();
    }
}
