using HR_System.DTOs.OrganizationEvents;
using HR_System.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace HR_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrganizationEventsController : ControllerBase
    {
        private readonly IOrganizationEventService _organizationEventService;
        private readonly ILogger<OrganizationEventsController> _logger;

        public OrganizationEventsController(
            IOrganizationEventService organizationEventService,
            ILogger<OrganizationEventsController> logger)
        {
            _organizationEventService = organizationEventService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<OrganizationEventDto>>> GetOrganizationEvents(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? scopeType,
            [FromQuery] string? systemId)
        {
            try
            {
                var items = await _organizationEventService.GetOrganizationEventsAsync(
                    search,
                    status,
                    scopeType,
                    systemId);

                return Ok(items);
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
                _logger.LogError(ex, "Unexpected error while retrieving organization events.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<OrganizationEventDto>> CreateOrganizationEvent([FromBody] OrganizationEventCreateDto dto)
        {
            try
            {
                var createdEvent = await _organizationEventService.CreateOrganizationEventAsync(dto);
                return CreatedAtAction(nameof(GetOrganizationEvents), new { id = createdEvent.Id }, createdEvent);
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
                _logger.LogError(ex, "Unexpected error while creating organization event.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<OrganizationEventDto>> UpdateOrganizationEvent(string id, [FromBody] OrganizationEventUpdateDto dto)
        {
            try
            {
                var updatedEvent = await _organizationEventService.UpdateOrganizationEventAsync(id, dto);
                return Ok(updatedEvent);
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
                _logger.LogError(ex, "Unexpected error while updating organization event. EventId: {EventId}", id);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrganizationEvent(string id)
        {
            try
            {
                await _organizationEventService.SoftDeleteOrganizationEventAsync(id);
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
                _logger.LogError(ex, "Unexpected error while deleting organization event. EventId: {EventId}", id);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}