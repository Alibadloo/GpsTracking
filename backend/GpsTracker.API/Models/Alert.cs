namespace GpsTracker.API.Models;

public enum AlertType { SpeedExceeded, GeofenceEntry, GeofenceExit, DeviceOffline, LowBattery }
public enum AlertSeverity { Info, Warning, Critical }

public class Alert
{
    public int Id { get; set; }
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; } = AlertSeverity.Warning;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int DeviceId { get; set; }
    public Device Device { get; set; } = null!;
}
