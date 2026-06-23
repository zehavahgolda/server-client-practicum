using HR_System.Services;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// קריאת הגדרות החיבור ל-MongoDB מתוך קובץ ה-appsettings.json
var connectionString = builder.Configuration["MongoDB:ConnectionString"];
var databaseName = builder.Configuration["MongoDB:DatabaseName"];

// רישום ה-MongoClient כסינגלטון (מופע יחיד לכל אורך חיי היישום)
builder.Services.AddSingleton<IMongoClient>(new MongoClient(connectionString));

// רישום ה-IMongoDatabase כ-Scoped (מופע חדש לכל בקשה)
builder.Services.AddScoped<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));

// הוספת בקרים והגדרת סריאליזציה ל-JSON עבור תאימות ל-Frontend
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// רישום שירותי האפליקציה לצורך הזרקת תלויות (Dependency Injection)
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ISystemService, SystemService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IChangeService, ChangeService>();

// הגדרת מדיניות CORS עבור ממשק המשתמש המקומי
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalUI", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// הגדרות סביבת פיתוח
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// הפעלת CORS באופן גלובלי
app.UseCors("AllowLocalUI");

// הפעלת אימות והרשאות
app.UseAuthorization();
app.MapControllers();

app.Run();