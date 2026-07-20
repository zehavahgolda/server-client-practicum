using HR_System.DTOs.Employees;
using HR_System.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace HR_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            IEmployeeService employeeService,
            ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        /// <summary>
        /// שליפת רשימת עובדים לפי פרמטרים.
        ///
        /// isActive:
        /// true  - עובדים פעילים בלבד.
        /// false - עובדים לא פעילים בלבד.
        /// null  - כל העובדים.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<EmployeeListItemDto>>>
            GetEmployees(
                [FromQuery] int? year,
                [FromQuery] string? managerName,
                [FromQuery] string? professionalCategory,
                [FromQuery] string? systemId,
                [FromQuery] string? search,
                [FromQuery] bool? isActive)
        {
            _logger.LogInformation(
                "GetEmployees request received. Year: {Year}, Manager: {Manager}, Category: {Category}, System: {SystemId}, Search: {Search}, IsActive: {IsActive}",
                year,
                managerName,
                professionalCategory,
                systemId,
                search,
                isActive);

            try
            {
                var employees =
                    await _employeeService.GetEmployeesAsync(
                        year,
                        managerName,
                        professionalCategory,
                        systemId,
                        search,
                        isActive);

                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing GetEmployees request. IsActive: {IsActive}",
                    isActive);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// שליפת עובדים אפשריים לשיבוץ למערכת.
        /// מיועד ל-Drawer של שיבוץ עובדים מתוך פרופיל מערכת.
        /// </summary>
        [HttpGet("assignment-candidates")]
        public async Task<ActionResult<
            List<EmployeeAssignmentCandidateDto>>>
            GetAssignmentCandidates(
                [FromQuery] string systemId,
                [FromQuery] int? year,
                [FromQuery] string? search)
        {
            _logger.LogInformation(
                "GetAssignmentCandidates request received. SystemId: {SystemId}, Year: {Year}, Search: {Search}",
                systemId,
                year,
                search);

            try
            {
                if (string.IsNullOrWhiteSpace(systemId))
                {
                    _logger.LogWarning(
                        "GetAssignmentCandidates request rejected because SystemId was not provided.");

                    return BadRequest(
                        "systemId is required.");
                }

                var employees =
                    await _employeeService
                        .GetAssignmentCandidatesAsync(
                            systemId,
                            year,
                            search);

                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing GetAssignmentCandidates request.");

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// שליפת פרטי עובד ספציפי לפי מזהה.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDetailsDto>>
            GetEmployeeById(string id)
        {
            _logger.LogInformation(
                "GetEmployeeById request received. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var employee =
                    await _employeeService
                        .GetEmployeeByIdAsync(id);

                if (employee is null)
                {
                    _logger.LogWarning(
                        "Employee not found. EmployeeId: {EmployeeId}",
                        id);

                    return NotFound();
                }

                return Ok(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing GetEmployeeById request. EmployeeId: {EmployeeId}",
                    id);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// עדכון חודשי עבודה בפועל עבור הקצאת עובד למערכת.
        /// </summary>
        [HttpPut("{id}/allocation-months")]
        public async Task<IActionResult>
            UpdateAllocationMonths(
                string id,
                [FromQuery] string? systemId,
                [FromQuery] string? roleInSystem,
                [FromQuery] int? actualMonths)
        {
            _logger.LogInformation(
                "UpdateAllocationMonths request received. EmployeeId: {EmployeeId}, SystemId: {SystemId}, Role: {RoleInSystem}, ActualMonths: {ActualMonths}",
                id,
                systemId,
                roleInSystem,
                actualMonths);

            try
            {
                if (string.IsNullOrWhiteSpace(systemId) ||
                    string.IsNullOrWhiteSpace(roleInSystem) ||
                    !actualMonths.HasValue)
                {
                    _logger.LogWarning(
                        "UpdateAllocationMonths request rejected due to missing required parameters. EmployeeId: {EmployeeId}",
                        id);

                    return BadRequest(
                        "Required parameters: systemId, roleInSystem, and actualMonths must be provided.");
                }

                var success =
                    await _employeeService
                        .UpdateAllocationActualMonthsAsync(
                            id,
                            systemId,
                            roleInSystem,
                            actualMonths.Value);

                if (!success)
                {
                    _logger.LogWarning(
                        "Employee allocation was not found. EmployeeId: {EmployeeId}, SystemId: {SystemId}, Role: {RoleInSystem}",
                        id,
                        systemId,
                        roleInSystem);

                    return NotFound(
                        "Employee allocation was not found for the specified system and role.");
                }

                return Ok(new
                {
                    message =
                        $"Actual months updated to {actualMonths}."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing UpdateAllocationMonths request. EmployeeId: {EmployeeId}",
                    id);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// יצירת עובד חדש.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<string>>
            CreateEmployee(
                [FromBody] EmployeeCreateDto dto)
        {
            _logger.LogInformation(
                "CreateEmployee request received.");

            try
            {
                var id =
                    await _employeeService
                        .CreateEmployeeAsync(dto);

                return CreatedAtAction(
                    nameof(GetEmployeeById),
                    new { id },
                    id);
            }
            catch (BusinessValidationException ex)
            {
                _logger.LogWarning(
                    "CreateEmployee validation failed: {ValidationMessage}",
                    ex.Message);

                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing CreateEmployee request.");

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// עדכון עובד קיים.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult>
            UpdateEmployee(
                string id,
                [FromBody] EmployeeEditDto dto)
        {
            _logger.LogInformation(
                "UpdateEmployee request received. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var success =
                    await _employeeService
                        .UpdateEmployeeAsync(id, dto);

                if (!success)
                {
                    _logger.LogWarning(
                        "Employee update could not be completed. EmployeeId: {EmployeeId}",
                        id);

                    return NotFound(
                        "Employee not found or no changes were made.");
                }

                return NoContent();
            }
            catch (BusinessValidationException ex)
            {
                _logger.LogWarning(
                    "UpdateEmployee validation failed. EmployeeId: {EmployeeId}, ValidationMessage: {ValidationMessage}",
                    id,
                    ex.Message);

                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing UpdateEmployee request. EmployeeId: {EmployeeId}",
                    id);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// הוספת הקצאה לעובד קיים.
        /// </summary>
        [HttpPost("{id}/allocations")]
        public async Task<IActionResult>
            AddAllocation(
                string id,
                [FromBody] AllocationCreateDto dto)
        {
            _logger.LogInformation(
                "AddAllocation request received. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var success =
                    await _employeeService
                        .AddAllocationAsync(id, dto);

                if (!success)
                {
                    _logger.LogWarning(
                        "Employee allocation request could not be completed. EmployeeId: {EmployeeId}",
                        id);

                    return BadRequest(
                        "Employee not found, already assigned, inactive, or does not have enough remaining months.");
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing AddAllocation request. EmployeeId: {EmployeeId}",
                    id);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// שיבוץ כמה עובדים למערכת בפעולה אחת.
        /// </summary>
        [HttpPost("bulk-assign")]
        public async Task<IActionResult>
            BulkAssignEmployees(
                [FromBody] BulkAssignEmployeesDto dto)
        {
            _logger.LogInformation(
                "BulkAssignEmployees request received.");

            try
            {
                var result =
                    await _employeeService
                        .BulkAssignEmployeesToSystemAsync(dto);

                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Bulk employee assignment request could not be completed.");

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing BulkAssignEmployees request.");

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// מחיקה רכה של עובד.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult>
            DeleteEmployee(string id)
        {
            _logger.LogInformation(
                "DeleteEmployee request received. EmployeeId: {EmployeeId}",
                id);

            try
            {
                var success =
                    await _employeeService
                        .DeleteEmployeeAsync(id);

                if (!success)
                {
                    _logger.LogWarning(
                        "Employee deactivation could not be completed. EmployeeId: {EmployeeId}",
                        id);

                    return NotFound(
                        "Employee not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while processing DeleteEmployee request. EmployeeId: {EmployeeId}",
                    id);

                return StatusCode(
                    500,
                    "An unexpected error occurred.");
            }
        }
    }
}