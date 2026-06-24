using Microsoft.AspNetCore.Mvc;
using HR_System.DTOs.Systems;
using HR_System.Services;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly ISystemService _systemService;

    public SystemController(ISystemService systemService)
    {
        _systemService = systemService;
    }

    /// <summary>
    /// שליפת רשימת המערכות עם אפשרויות סינון.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SystemListItemDto>>> GetSystems(
        [FromQuery] int? year,
        [FromQuery] string? status,
        [FromQuery] string? ownerManagerName,
        [FromQuery] string? search)
    {
        try
        {
            var systems = await _systemService.GetSystemsAsync(year, status, ownerManagerName, search);
            return Ok(systems);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// <summary>
    /// שליפת דוח מערכות שנמצאות בסטטוס חוסר (Shortage).
    /// </summary>
    [HttpGet("shortage")]
    public async Task<ActionResult<List<SystemListItemDto>>> GetSystemsWithShortage()
    {
        try
        {
            var systems = await _systemService.GetSystemsWithShortageAsync();
            return Ok(systems);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// <summary>
    /// שליפת פרטים מלאים של מערכת ספציפית לפי מזהה.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SystemDetailsDto>> GetSystemById(string id)
    {
        try
        {
            var system = await _systemService.GetSystemByIdAsync(id);
            if (system is null) return NotFound();

            return Ok(system);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// <summary>
    /// יצוא נתוני המערכות לקובץ אקסל להורדה.
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportSystemsToExcel(
        [FromQuery] int? year,
        [FromQuery] string? status)
    {
        try
        {
            var fileContent = await _systemService.ExportSystemsToExcelAsync(year, status);

            return File(
                fileContent,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Systems_Report.xlsx"
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] SystemCreateDto dto)
    {
        try
        {
            if (dto == null) return BadRequest("System data is required.");

            await _systemService.CreateSystemAsync(dto);

            // החזרת הצלחה (201 Created הוא הסטטוס המקובל ל-POST)
            return Ok(new { message = "System created successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// עדכון מערכת קיימת (PUT).
    /// מקבל את המזהה בנתיב ואת הנתונים החדשים בגוף הבקשה.

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] SystemCreateDto dto)
    {
        try
        {
            await _systemService.UpdateSystemAsync(id, dto);
            return NoContent(); // 204 מציין הצלחה ללא צורך בהחזרת אובייקט
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// מחיקת מערכת מהמערכת (DELETE).

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        try
        {
            await _systemService.DeleteSystemAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

}