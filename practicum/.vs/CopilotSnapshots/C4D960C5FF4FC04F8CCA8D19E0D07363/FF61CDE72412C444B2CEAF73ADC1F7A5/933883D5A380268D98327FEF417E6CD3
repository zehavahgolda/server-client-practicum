using HR_System.DTOs.Employees;
using HR_System.Services;
using Microsoft.AspNetCore.Mvc;

namespace HR_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<ActionResult<List<EmployeeListItemDto>>> GetEmployees(
            [FromQuery] int? year,
            [FromQuery] string? managerName,
            [FromQuery] string? professionalCategory,
            [FromQuery] string? systemId,
            [FromQuery] string? search)
        {
            try
            {
                var employees = await _employeeService.GetEmployeesAsync(
                    year,
                    managerName,
                    professionalCategory,
                    systemId,
                    search);
                return Ok(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDetailsDto>> GetEmployeeById(string id)
        {
            try
            {
                var employee = await _employeeService.GetEmployeeByIdAsync(id);
                if (employee is null)
                {
                    return NotFound();
                }

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

      
        [HttpPut("{id}/allocation-months")]
        public async Task<IActionResult> UpdateAllocationMonths(
            string id,
            [FromQuery] string? systemId,
            [FromQuery] string? roleInSystem,
            [FromQuery] int? actualMonths)
        {
            // Validate required parameters
            if (string.IsNullOrWhiteSpace(systemId) || string.IsNullOrWhiteSpace(roleInSystem) || !actualMonths.HasValue)
            {
                return BadRequest("Required parameters: systemId, roleInSystem, and actualMonths must be provided.");
            }

            var success = await _employeeService.UpdateAllocationActualMonthsAsync(id, systemId, roleInSystem, actualMonths.Value);

            if (!success)
                return NotFound("Employee allocation was not found for the specified system and role.");

            return Ok(new { message = $"Actual months updated to {actualMonths}." });
        }
    }
}