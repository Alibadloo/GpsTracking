using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Models;

namespace GpsTracker.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Device> Devices => Set<Device>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Geofence> Geofences => Set<Geofence>();
    public DbSet<Alert> Alerts => Set<Alert>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<Device>(e => e.Property(d => d.Type).HasConversion<string>());
        m.Entity<Device>(e => e.Property(d => d.Status).HasConversion<string>());
        m.Entity<Alert>(e => e.Property(a => a.Type).HasConversion<string>());
        m.Entity<Alert>(e => e.Property(a => a.Severity).HasConversion<string>());

        m.Entity<Location>(e =>
        {
            e.HasIndex(l => new { l.DeviceId, l.Timestamp });
            e.HasOne(l => l.Device).WithMany(d => d.Locations).HasForeignKey(l => l.DeviceId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<Alert>(e =>
            e.HasOne(a => a.Device).WithMany(d => d.Alerts).HasForeignKey(a => a.DeviceId).OnDelete(DeleteBehavior.Cascade));
    }
}
