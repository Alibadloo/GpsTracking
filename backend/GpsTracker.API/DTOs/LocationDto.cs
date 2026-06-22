namespace GpsTracker.API.DTOs;

public class LocationUpdateDto
{
    public int DeviceId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public double Altitude { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceColor { get; set; } = "#6366F1";
    public string DeviceType { get; set; } = "Car";
    public string Status { get; set; } = "Active";
}

public class RouteHistoryDto
{
    public long Id { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public DateTime Timestamp { get; set; }
}
