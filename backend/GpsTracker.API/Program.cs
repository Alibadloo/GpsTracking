using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.Hubs;
using GpsTracker.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=gpstracker.db"));

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSingleton<TrackingService>();
builder.Services.AddSingleton<SimulatorService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<SimulatorService>());

builder.Services.AddCors(opt =>
    opt.AddPolicy("DevPolicy", p =>
        p.WithOrigins("http://localhost:5173", "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors("DevPolicy");
app.UseWebSockets();
app.MapControllers();
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();
