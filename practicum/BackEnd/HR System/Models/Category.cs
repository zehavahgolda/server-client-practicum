using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HR_System.Models
{
    [BsonIgnoreExtraElements]
    public class Category
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("innerCategory")]
        public string? innerCategory { get; set; }

        [BsonElement("subcategories")]
        public List<CategorySubcategory> Subcategories { get; set; } = new();

        [BsonElement("isDeleted")]
        public bool IsDeleted { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class CategorySubcategory
    {
        [BsonElement("id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("isDeleted")]
        public bool IsDeleted { get; set; }
    }
}