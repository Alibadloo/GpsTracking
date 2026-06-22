using GpsTracker.API.Models;

namespace GpsTracker.API.DTOs;

public class DeviceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public double? LastLat { get; set; }
    public double? LastLng { get; set; }
    public double? LastSpeed { get; set; }
    public DateTime? LastSeen { get; set; }
    public bool IsSimulated { get; set; }
}

public class CreateDeviceDto
{
    public string Name { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public DeviceType Type { get; set; } = DeviceType.Car;
    public string Color { get; set; } = "#6366F1";
}

public class AlertDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public int DeviceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
