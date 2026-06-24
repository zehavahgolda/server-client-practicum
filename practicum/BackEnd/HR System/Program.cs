using HR_System.Services;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// ����� ������ ������ �-MongoDB ���� ���� �-appsettings.json
var connectionString = builder.Configuration["MongoDB:ConnectionString"];
var databaseName = builder.Configuration["MongoDB:DatabaseName"];

// ����� �-MongoClient ��������� (���� ���� ��� ���� ��� ������)
builder.Services.AddSingleton<IMongoClient>(new MongoClient(connectionString));

// ����� �-IMongoDatabase �-Scoped (���� ��� ��� ����)
builder.Services.AddScoped<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));

// ����� ����� ������ ���������� �-JSON ���� ������ �-Frontend
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ����� ������ ��������� ����� ����� ������ (Dependency Injection)
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ISystemService, SystemService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IChangeService, ChangeService>();

// ����� ������� CORS ���� ���� ������ ������
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalUI", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddAutoMapper(typeof(AutoMappering));

var app = builder.Build();

// ������ ����� �����
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ����� CORS ����� ������
app.UseCors("AllowLocalUI");

// ����� ����� �������
app.UseAuthorization();
app.MapControllers();

app.Run();