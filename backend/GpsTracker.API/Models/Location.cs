namespace GpsTracker.API.Models;

public class Location
{
    public long Id { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public double Altitude { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int DeviceId { get; set; }
    public Device Device { get; set; } = null!;
}
