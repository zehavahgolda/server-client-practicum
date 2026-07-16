namespace HR_System.DTOs.Categories
{
    public class CategorySubcategoryDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string ParentCategoryId { get; set; } = null!;
        public string ParentCategoryName { get; set; } = null!;
    }
}
