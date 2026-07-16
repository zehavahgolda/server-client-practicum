namespace HR_System.DTOs.Categories
{
    public class CategorySubcategoryMutationResult
    {
        public bool Found { get; set; }
        public bool Conflict { get; set; }
        public int AffectedEmployeesCount { get; set; }
        public string? ConflictMessage { get; set; }
        public CategorySubcategoryDto? Subcategory { get; set; }
    }
}
