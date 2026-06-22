using Microsoft.AspNetCore.Mvc;
using GpsTracker.API.Services;

namespace GpsTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulatorController : ControllerBase
{
    private readonly SimulatorService _sim;

    public SimulatorController(SimulatorService sim) => _sim = sim;

    [HttpPost("start")]
    public IActionResult Start()
    {
        _sim.Start();
        return Ok(new { running = true, message = "Simulation started — 5 vehicles are now moving." });
    }

    [HttpPost("stop")]
    public IActionResult Stop()
    {
        _sim.Stop();
        return Ok(new { running = false, message = "Simulation stopped." });
    }

    [HttpGet("status")]
    public IActionResult Status()
        => Ok(new { running = _sim.IsRunning });
}
