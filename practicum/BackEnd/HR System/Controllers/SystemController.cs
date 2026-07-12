using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using HR_System.DTOs.Systems;
using HR_System.Services;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly ISystemService _systemService;
    private readonly ILogger<SystemController> _logger;

    public SystemController(
        ISystemService systemService,
        ILogger<SystemController> logger)
    {
        _systemService = systemService;
        _logger = logger;
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
        _logger.LogInformation(
            "GetSystems request received. Year: {Year}, Status: {Status}, HasOwnerManagerFilter: {HasOwnerManagerFilter}, HasSearchTerm: {HasSearchTerm}",
            year,
            status,
            !string.IsNullOrWhiteSpace(ownerManagerName),
            !string.IsNullOrWhiteSpace(search));

        try
        {
            var systems = await _systemService.GetSystemsAsync(
                year,
                status,
                ownerManagerName,
                search);

            return Ok(systems);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing GetSystems request. Year: {Year}, Status: {Status}",
                year,
                status);

            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    /// <summary>
    /// שליפת דוח מערכות שנמצאות בסטטוס חוסר (Shortage).
    /// </summary>
    [HttpGet("shortage")]
    public async Task<ActionResult<List<SystemListItemDto>>> GetSystemsWithShortage()
    {
        _logger.LogInformation(
            "GetSystemsWithShortage request received.");

        try
        {
            var systems = await _systemService.GetSystemsWithShortageAsync();

            return Ok(systems);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing GetSystemsWithShortage request.");

            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    /// <summary>
    /// שליפת פרטים מלאים של מערכת ספציפית לפי מזהה.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SystemDetailsDto>> GetSystemById(string id)
    {
        _logger.LogInformation(
            "GetSystemById request received. SystemId: {SystemId}",
            id);

        try
        {
            var system = await _systemService.GetSystemByIdAsync(id);

            if (system is null)
            {
                _logger.LogWarning(
                    "System was not found. SystemId: {SystemId}",
                    id);

                return NotFound();
            }

            return Ok(system);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing GetSystemById request. SystemId: {SystemId}",
                id);

            return StatusCode(500, "An unexpected error occurred.");
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
        _logger.LogInformation(
            "ExportSystemsToExcel request received. Year: {Year}, Status: {Status}",
            year,
            status);

        try
        {
            var fileContent = await _systemService.ExportSystemsToExcelAsync(
                year,
                status);

            return File(
                fileContent,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Systems_Report.xlsx"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing ExportSystemsToExcel request. Year: {Year}, Status: {Status}",
                year,
                status);

            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] SystemCreateDto dto)
    {
        _logger.LogInformation(
            "CreateSystem request received.");

        try
        {
            if (dto == null)
            {
                _logger.LogWarning(
                    "CreateSystem request rejected because system data was not provided.");

                return BadRequest("System data is required.");
            }

            await _systemService.CreateSystemAsync(dto);

            return Ok(new { message = "System created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing CreateSystem request.");

            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    /// עדכון מערכת קיימת (PUT).
    /// מקבל את המזהה בנתיב ואת הנתונים החדשים בגוף הבקשה.
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(
        string id,
        [FromBody] SystemCreateDto dto)
    {
        _logger.LogInformation(
            "UpdateSystem request received. SystemId: {SystemId}",
            id);

        try
        {
            if (dto == null)
            {
                _logger.LogWarning(
                    "UpdateSystem request rejected because system data was not provided. SystemId: {SystemId}",
                    id);

                return BadRequest("System data is required.");
            }

            await _systemService.UpdateSystemAsync(id, dto);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing UpdateSystem request. SystemId: {SystemId}",
                id);

            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    /// מחיקת מערכת מהמערכת (DELETE).
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        _logger.LogInformation(
            "DeleteSystem request received. SystemId: {SystemId}",
            id);

        try
        {
            await _systemService.DeleteSystemAsync(id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error while processing DeleteSystem request. SystemId: {SystemId}",
                id);

            return StatusCode(500, "An unexpected error occurred.");
        }
    }
}