using HR_System.DTOs.Employees;
using HR_System.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace HR_System.Controllers
{
    [ApiController]
    [Route("api/Employees/{employeeId}/events")]
    public class EmployeeEventsController : ControllerBase
    {
        private readonly IEmployeeEventService _employeeEventService;
        private readonly ILogger<EmployeeEventsController> _logger;

        public EmployeeEventsController(
            IEmployeeEventService employeeEventService,
            ILogger<EmployeeEventsController> logger)
        {
            _employeeEventService = employeeEventService;
            _logger = logger;
        }

        [HttpPost("/api/Employees/events/batch")]
        [HttpPost("/api/EmployeeEvents/batch")]
        public async Task<ActionResult<EmployeeEventBatchResponseDto>> GetEmployeeEventsBatch(
            [FromBody] EmployeeEventBatchRequestDto request)
        {
            try
            {
                return Ok(await _employeeEventService.GetEmployeeEventsBatchAsync(request));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving employee events batch.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<EmployeeEventDto>>> GetEmployeeEvents(string employeeId)
        {
            try
            {
                return Ok(await _employeeEventService.GetEmployeeEventsAsync(employeeId));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving employee events. EmployeeId: {EmployeeId}", employeeId);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<EmployeeEventDto>> CreateEmployeeEvent(
            string employeeId,
            [FromBody] EmployeeEventCreateDto dto)
        {
            try
            {
                var employeeEvent = await _employeeEventService.CreateEmployeeEventAsync(employeeId, dto);
                return CreatedAtAction(nameof(GetEmployeeEvents), new { employeeId }, employeeEvent);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating employee event. EmployeeId: {EmployeeId}", employeeId);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPut("{eventId}")]
        public async Task<ActionResult<EmployeeEventDto>> UpdateEmployeeEvent(
            string employeeId,
            string eventId,
            [FromBody] EmployeeEventUpdateDto dto)
        {
            try
            {
                return Ok(await _employeeEventService.UpdateEmployeeEventAsync(employeeId, eventId, dto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating employee event. EmployeeId: {EmployeeId}, EventId: {EventId}", employeeId, eventId);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpDelete("{eventId}")]
        public async Task<IActionResult> DeleteEmployeeEvent(string employeeId, string eventId)
        {
            try
            {
                await _employeeEventService.SoftDeleteEmployeeEventAsync(employeeId, eventId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while deleting employee event. EmployeeId: {EmployeeId}, EventId: {EventId}", employeeId, eventId);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}