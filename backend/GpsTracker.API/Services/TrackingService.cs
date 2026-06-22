using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.DTOs;
using GpsTracker.API.Hubs;
using GpsTracker.API.Models;

namespace GpsTracker.API.Services;

public class TrackingService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<TrackingHub> _hub;

    public TrackingService(IServiceScopeFactory scopeFactory, IHubContext<TrackingHub> hub)
    {
        _scopeFactory = scopeFactory;
        _hub = hub;
    }

    public async Task ProcessLocationAsync(LocationUpdateDto dto)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var device = await db.Devices.FindAsync(dto.DeviceId);
        if (device is null) return;

        device.Status = DeviceStatus.Active;

        var location = new Location
        {
            DeviceId = dto.DeviceId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Speed = dto.Speed,
            Heading = dto.Heading,
            Altitude = dto.Altitude,
            Timestamp = dto.Timestamp
        };
        db.Locations.Add(location);

        // Speed alert
        double speedLimit = device.Type == DeviceType.Truck ? 80 : 120;
        if (dto.Speed > speedLimit)
        {
            db.Alerts.Add(new Alert
            {
                DeviceId = dto.DeviceId,
                Type = AlertType.SpeedExceeded,
                Severity = AlertSeverity.Warning,
                Message = $"{device.Name} exceeded speed limit: {dto.Speed:F0} km/h"
            });
        }

        await db.SaveChangesAsync();

        dto.DeviceName = device.Name;
        dto.DeviceColor = device.Color;
        dto.DeviceType = device.Type.ToString();
        dto.Status = device.Status.ToString();

        await _hub.Clients.Group("all-devices").SendAsync("LocationUpdate", dto);
        await _hub.Clients.Group($"device-{dto.DeviceId}").SendAsync("DeviceLocationUpdate", dto);

        await CheckGeofencesAsync(dto);
    }

    public async Task CheckGeofencesAsync(LocationUpdateDto dto)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var geofences = await db.Geofences.Where(g => g.IsActive && g.IsCircle).ToListAsync();

        foreach (var gf in geofences)
        {
            var dist = HaversineDistance(dto.Latitude, dto.Longitude, gf.CenterLat, gf.CenterLng);
            if (dist <= gf.RadiusMeters)
            {
                var device = await db.Devices.FindAsync(dto.DeviceId);
                if (device is null) continue;

                db.Alerts.Add(new Alert
                {
                    DeviceId = dto.DeviceId,
                    Type = AlertType.GeofenceEntry,
                    Severity = AlertSeverity.Info,
                    Message = $"{device.Name} entered geofence: {gf.Name}"
                });
                await db.SaveChangesAsync();
            }
        }
    }

    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
