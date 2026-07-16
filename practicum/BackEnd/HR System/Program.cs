using HR_System.Services;
using MongoDB.Driver;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// =======================
// Configure Serilog
// =======================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

var connectionString = builder.Configuration["MongoDB:ConnectionString"];
var databaseName = builder.Configuration["MongoDB:DatabaseName"];

builder.Services.AddSingleton<IMongoClient>(new MongoClient(connectionString));

builder.Services.AddScoped<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IEmployeeEventService, EmployeeEventService>();
builder.Services.AddScoped<ISystemService, SystemService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IChangeService, ChangeService>();
builder.Services.AddScoped<IOrganizationEventService, OrganizationEventService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalUI", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAutoMapper(typeof(AutoMappering));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowLocalUI");

app.UseAuthorization();

app.MapControllers();

try
{
    Log.Information("HR System API started successfully.");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "HR System API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}