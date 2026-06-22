using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.DTOs;
using GpsTracker.API.Models;

namespace GpsTracker.API.Services;

// Tehran routes: pre-defined waypoints for demo simulation
public class SimulatorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TrackingService _trackingService;
    private readonly ILogger<SimulatorService> _logger;
    private bool _running = false;

    // Tehran GPS routes
    private static readonly (double lat, double lng)[][] Routes =
    [
        // Route 1 — Around Azadi Tower
        [(35.6997,51.3380),(35.7035,51.3410),(35.7065,51.3450),(35.7050,51.3500),
         (35.7010,51.3490),(35.6975,51.3460),(35.6960,51.3410),(35.6980,51.3375)],
        // Route 2 — Vali Asr Street (north)
        [(35.7000,51.4100),(35.7055,51.4118),(35.7110,51.4135),(35.7165,51.4152),
         (35.7220,51.4170),(35.7165,51.4152),(35.7110,51.4135),(35.7055,51.4118)],
        // Route 3 — Near Milad Tower
        [(35.7449,51.3744),(35.7420,51.3790),(35.7390,51.3835),(35.7360,51.3880),
         (35.7390,51.3835),(35.7420,51.3790),(35.7449,51.3744),(35.7449,51.3744)],
        // Route 4 — Eastern Tehran highway
        [(35.7200,51.4550),(35.7175,51.4610),(35.7150,51.4670),(35.7125,51.4730),
         (35.7150,51.4670),(35.7175,51.4610),(35.7200,51.4550),(35.7200,51.4550)],
        // Route 5 — Southern ring road
        [(35.6700,51.3800),(35.6725,51.3860),(35.6750,51.3920),(35.6775,51.3980),
         (35.6750,51.3920),(35.6725,51.3860),(35.6700,51.3800),(35.6700,51.3800)],
    ];

    private static readonly (string name, string plate, DeviceType type, string color, double speedKmh)[] VehicleConfig =
    [
        ("Truck Alpha",   "11A-111", DeviceType.Truck,  "#EF4444", 65),
        ("Car Beta",      "22B-222", DeviceType.Car,    "#3B82F6", 90),
        ("Van Gamma",     "33C-333", DeviceType.Van,    "#10B981", 75),
        ("Bike Delta",    "44D-444", DeviceType.Motorcycle, "#F59E0B", 110),
        ("Fleet Echo",    "55E-555", DeviceType.Car,    "#8B5CF6", 85),
    ];

    // Current waypoint index per device
    private readonly int[] _waypointIndex = new int[5];
    private readonly double[] _waypointProgress = new double[5];

    public bool IsRunning => _running;

    public SimulatorService(IServiceScopeFactory scopeFactory, TrackingService trackingService, ILogger<SimulatorService> logger)
    {
        _scopeFactory = scopeFactory;
        _trackingService = trackingService;
        _logger = logger;
    }

    public void Start() => _running = true;
    public void Stop() => _running = false;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await SeedDevicesAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_running)
            {
                for (int i = 0; i < VehicleConfig.Length; i++)
                    await SimulateDeviceAsync(i + 1, i);
            }
            await Task.Delay(1500, stoppingToken);
        }
    }

    private async Task SimulateDeviceAsync(int deviceId, int vehicleIndex)
    {
        var route = Routes[vehicleIndex];
        var config = VehicleConfig[vehicleIndex];

        int fromIdx = _waypointIndex[vehicleIndex] % route.Length;
        int toIdx = (fromIdx + 1) % route.Length;

        var from = route[fromIdx];
        var to = route[toIdx];

        _waypointProgress[vehicleIndex] += 0.08;
        if (_waypointProgress[vehicleIndex] >= 1.0)
        {
            _waypointProgress[vehicleIndex] = 0;
            _waypointIndex[vehicleIndex]++;
        }

        double t = _waypointProgress[vehicleIndex];
        double lat = from.lat + (to.lat - from.lat) * t;
        double lng = from.lng + (to.lng - from.lng) * t;

        // Add small random noise
        lat += (Random.Shared.NextDouble() - 0.5) * 0.0002;
        lng += (Random.Shared.NextDouble() - 0.5) * 0.0002;

        double heading = Math.Atan2(to.lng - from.lng, to.lat - from.lat) * 180 / Math.PI;
        double speed = config.speedKmh + (Random.Shared.NextDouble() - 0.5) * 20;

        await _trackingService.ProcessLocationAsync(new LocationUpdateDto
        {
            DeviceId = deviceId,
            Latitude = lat,
            Longitude = lng,
            Speed = Math.Max(0, speed),
            Heading = (heading + 360) % 360,
            Altitude = 1200 + Random.Shared.NextDouble() * 100,
            Timestamp = DateTime.UtcNow
        });
    }

    private async Task SeedDevicesAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (await db.Devices.AnyAsync()) return;

        foreach (var (name, plate, type, color, _) in VehicleConfig)
        {
            db.Devices.Add(new Device { Name = name, PlateNumber = plate, Type = type, Color = color, Status = DeviceStatus.Offline, IsSimulated = true });
        }

        // Seed a sample geofence (Azadi Tower area)
        db.Geofences.Add(new Geofence
        {
            Name = "Azadi Zone",
            Color = "#EF4444",
            CenterLat = 35.7007,
            CenterLng = 51.3378,
            RadiusMeters = 800,
            IsCircle = true
        });

        db.Geofences.Add(new Geofence
        {
            Name = "Milad Tower Zone",
            Color = "#F59E0B",
            CenterLat = 35.7449,
            CenterLng = 51.3744,
            RadiusMeters = 600,
            IsCircle = true
        });

        await db.SaveChangesAsync();
        _logger.LogInformation("Seeded 5 demo vehicles and 2 geofences.");
    }
}
