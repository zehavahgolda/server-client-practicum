using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    /// <summary>
    /// שירות לניהול קטגוריות מקצועיות במערכת.
    /// אחראי על שליפה ויצירה של הגדרות קטגוריות המשמשות את העובדים והמערכות.
    /// </summary>
    public class CategoryService : ICategoryService
    {
        private readonly IMongoCollection<Category> _categoriesCollection;

        public CategoryService(IMongoDatabase database)
        {
            // אתחול האוסף המכיל את הקטגוריות מתוך מסד הנתונים
            _categoriesCollection = database.GetCollection<Category>("Categories");
        }

        /// <summary>
        /// שליפת רשימת כל הקטגוריות הקיימות במערכת.
        /// </summary>
        public async Task<List<Category>> GetAllCategoriesAsync() =>
            await _categoriesCollection.Find(_ => true).ToListAsync();

        /// <summary>
        /// שליפת קטגוריה ספציפית לפי המזהה הייחודי (ID) שלה.
        /// </summary>
        public async Task<Category?> GetCategoryByIdAsync(string id) =>
            await _categoriesCollection.Find(c => c.Id == id).FirstOrDefaultAsync();

        /// <summary>
        /// הוספת קטגוריה חדשה למסד הנתונים.
        /// </summary>
        public async Task CreateCategoryAsync(Category category) =>
            await _categoriesCollection.InsertOneAsync(category);
    }
}