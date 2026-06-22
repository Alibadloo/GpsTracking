namespace GpsTracker.API.Models;

public class Geofence
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#EF4444";
    public string PolygonJson { get; set; } = "[]";
    public double CenterLat { get; set; }
    public double CenterLng { get; set; }
    public double RadiusMeters { get; set; }
    public bool IsCircle { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
