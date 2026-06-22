using Microsoft.AspNetCore.Mvc;
using GpsTracker.API.DTOs;
using GpsTracker.API.Services;

namespace GpsTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly TrackingService _tracking;

    public LocationsController(TrackingService tracking) => _tracking = tracking;

    // Endpoint for real GPS hardware to POST location data
    [HttpPost]
    public async Task<IActionResult> ReceiveLocation([FromBody] LocationUpdateDto dto)
    {
        await _tracking.ProcessLocationAsync(dto);
        await _tracking.CheckGeofencesAsync(dto);
        return Ok();
    }
}
