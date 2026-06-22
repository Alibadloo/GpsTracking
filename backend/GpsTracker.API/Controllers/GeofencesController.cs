using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GpsTracker.API.Data;
using GpsTracker.API.Models;

namespace GpsTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GeofencesController : ControllerBase
{
    private readonly AppDbContext _db;

    public GeofencesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.Geofences.ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Geofence geo)
    {
        geo.CreatedAt = DateTime.UtcNow;
        _db.Geofences.Add(geo);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = geo.Id }, geo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var geo = await _db.Geofences.FindAsync(id);
        if (geo is null) return NotFound();
        _db.Geofences.Remove(geo);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
