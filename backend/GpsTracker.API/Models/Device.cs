namespace GpsTracker.API.Models;

public enum DeviceType { Car, Truck, Van, Motorcycle, Equipment, Person }
public enum DeviceStatus { Active, Idle, Offline, Alert }

public class Device
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public DeviceType Type { get; set; } = DeviceType.Car;
    public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
    public string Color { get; set; } = "#6366F1";
    public bool IsSimulated { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Location> Locations { get; set; } = new List<Location>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}
