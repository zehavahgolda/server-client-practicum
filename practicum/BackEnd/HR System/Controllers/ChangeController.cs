using Microsoft.AspNetCore.Mvc;
using HR_System.Models;
using HR_System.Services;

[ApiController]
[Route("api/[controller]")]
public class ChangeController : ControllerBase
{
    private readonly IChangeService _changeService;

    public ChangeController(IChangeService changeService)
    {
        _changeService = changeService;
    }

    [HttpGet("{systemId}")]
    public async Task<ActionResult<List<Change>>> GetBySystem(string systemId) =>
        Ok(await _changeService.GetChangesBySystemIdAsync(systemId));

    [HttpPost]
    public async Task<IActionResult> Create(Change change)
    {
        await _changeService.CreateChangeAsync(change);
        return Ok();
    }
}