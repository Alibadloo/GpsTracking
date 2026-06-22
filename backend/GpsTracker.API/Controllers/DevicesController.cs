using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.DTOs;
using GpsTracker.API.Models;

namespace GpsTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public DevicesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var devices = await _db.Devices
            .Select(d => new DeviceDto
            {
                Id = d.Id,
                Name = d.Name,
                PlateNumber = d.PlateNumber,
                Type = d.Type.ToString(),
                Status = d.Status.ToString(),
                Color = d.Color,
                LastLat = d.Locations.OrderByDescending(l => l.Timestamp).Select(l => (double?)l.Latitude).FirstOrDefault(),
                LastLng = d.Locations.OrderByDescending(l => l.Timestamp).Select(l => (double?)l.Longitude).FirstOrDefault(),
                LastSpeed = d.Locations.OrderByDescending(l => l.Timestamp).Select(l => (double?)l.Speed).FirstOrDefault(),
                LastSeen = d.Locations.OrderByDescending(l => l.Timestamp).Select(l => (DateTime?)l.Timestamp).FirstOrDefault(),
                IsSimulated = d.IsSimulated,
            })
            .ToListAsync();

        return Ok(devices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.Devices.FindAsync(id);
        return d is null ? NotFound() : Ok(new DeviceDto
        {
            Id = d.Id, Name = d.Name, PlateNumber = d.PlateNumber,
            Type = d.Type.ToString(), Status = d.Status.ToString(), Color = d.Color
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDeviceDto dto)
    {
        var device = new Device { Name = dto.Name, PlateNumber = dto.PlateNumber, Type = dto.Type, Color = dto.Color, IsSimulated = false };
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();
        var result = new DeviceDto
        {
            Id = device.Id, Name = device.Name, PlateNumber = device.PlateNumber,
            Type = device.Type.ToString(), Status = device.Status.ToString(),
            Color = device.Color, IsSimulated = false,
        };
        return CreatedAtAction(nameof(GetById), new { id = device.Id }, result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var device = await _db.Devices.FindAsync(id);
        if (device is null) return NotFound();
        _db.Devices.Remove(device);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/route")]
    public async Task<IActionResult> GetRoute(int id, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _db.Locations.Where(l => l.DeviceId == id);
        if (from.HasValue) query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(l => l.Timestamp <= to.Value);

        var route = await query
            .OrderBy(l => l.Timestamp)
            .TakeLast(500)
            .Select(l => new RouteHistoryDto
            {
                Id = l.Id, Latitude = l.Latitude, Longitude = l.Longitude,
                Speed = l.Speed, Heading = l.Heading, Timestamp = l.Timestamp
            })
            .ToListAsync();

        return Ok(route);
    }
}
