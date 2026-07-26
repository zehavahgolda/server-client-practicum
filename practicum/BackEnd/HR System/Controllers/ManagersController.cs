using HR_System.DTOs.Managers;
using HR_System.Services;
using Microsoft.AspNetCore.Mvc;

namespace HR_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManagersController : ControllerBase
    {
        private readonly IManagerService _managerService;
        private readonly ILogger<ManagersController> _logger;

        public ManagersController(
            IManagerService managerService,
            ILogger<ManagersController> logger)
        {
            _managerService = managerService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<ManagerListItemDto>>> GetManagers(
            [FromQuery] string? status,
            [FromQuery] string? search)
        {
            try
            {
                var rows = await _managerService.GetManagersAsync(status, search);
                return Ok(rows);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving managers.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpGet("candidates")]
        public async Task<ActionResult<List<ManagerCandidateDto>>> GetCandidates(
            [FromQuery] string? search)
        {
            try
            {
                var rows = await _managerService.GetManagerCandidatesAsync(search);
                return Ok(rows);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving manager candidates.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<ManagerMutationResultDto>> AddManager([FromBody] ManagerCreateDto dto)
        {
            try
            {
                var result = await _managerService.AddManagerAsync(dto);

                if (result.ResultType == "alreadyActive")
                {
                    return Conflict(result);
                }

                return Ok(result);
            }
            catch (BusinessValidationException ex)
            {
                if (ex.AffectedCount.HasValue && ex.AffectedCount.Value > 0)
                {
                    return Conflict(new
                    {
                        message = ex.Message,
                        affectedEmployeesCount = ex.AffectedCount.Value
                    });
                }

                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while adding manager.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPut("{id}/deactivate")]
        public async Task<ActionResult<ManagerDeactivateResultDto>> DeactivateManager(
            string id,
            [FromBody] ManagerDeactivateRequestDto? dto)
        {
            try
            {
                var result = await _managerService.DeactivateManagerAsync(id, dto?.DeactivationReason);
                return Ok(result);
            }
            catch (BusinessValidationException ex)
            {
                if (ex.AffectedCount.HasValue && ex.AffectedCount.Value > 0)
                {
                    return Conflict(new
                    {
                        message = ex.Message,
                        affectedEmployeesCount = ex.AffectedCount.Value
                    });
                }

                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while deactivating manager. DesignationId: {DesignationId}", id);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPut("{id}/reactivate")]
        public async Task<ActionResult<ManagerMutationResultDto>> ReactivateManager(string id)
        {
            try
            {
                var result = await _managerService.ReactivateManagerAsync(id);

                if (result.ResultType == "alreadyActive")
                {
                    return Conflict(result);
                }

                return Ok(result);
            }
            catch (BusinessValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while reactivating manager. DesignationId: {DesignationId}", id);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }

    public record ManagerDeactivateRequestDto
    {
        public string? DeactivationReason { get; init; }
    }
}
