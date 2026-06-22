using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.DTOs;

namespace GpsTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AlertsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int limit = 50)
    {
        var alerts = await _db.Alerts
            .Include(a => a.Device)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => new AlertDto
            {
                Id = a.Id,
                Type = a.Type.ToString(),
                Severity = a.Severity.ToString(),
                Message = a.Message,
                DeviceName = a.Device.Name,
                DeviceId = a.DeviceId,
                IsRead = a.IsRead,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(alerts);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert is null) return NotFound();
        alert.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _db.Alerts.Where(a => !a.IsRead).ExecuteUpdateAsync(s => s.SetProperty(a => a.IsRead, true));
        return Ok();
    }
}
