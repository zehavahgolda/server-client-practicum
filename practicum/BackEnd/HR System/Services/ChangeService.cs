using HR_System.Models;
using MongoDB.Driver;

namespace HR_System.Services
{
    /// <summary>
    /// שירות לניהול תיעוד שינויים במערכת.
    /// אחראי על שמירה ושליפה של היסטוריית השינויים עבור מערכות ספציפיות.
    /// </summary>
    public class ChangeService : IChangeService
    {
        private readonly IMongoCollection<Change> _changesCollection;

        public ChangeService(IMongoDatabase database)
        {
            // אתחול האוסף המכיל את כל השינויים מתוך מסד הנתונים
            _changesCollection = database.GetCollection<Change>("Changes");
        }

        /// <summary>
        /// שליפת כל השינויים הרלוונטיים עבור מערכת מסוימת לפי ה-ID שלה.
        /// </summary>
        public async Task<List<Change>> GetChangesBySystemIdAsync(string systemId) =>
            await _changesCollection.Find(c => c.SystemId == systemId).ToListAsync();

        /// <summary>
        /// יצירה והוספה של רשומת שינוי חדשה למסד הנתונים.
        /// </summary>
        public async Task CreateChangeAsync(Change change) =>
            await _changesCollection.InsertOneAsync(change);
    }
}