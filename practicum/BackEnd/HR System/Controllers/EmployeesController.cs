//using HR_System.DTOs.Employees;
//using HR_System.Services;
//using Microsoft.AspNetCore.Mvc;

//namespace HR_System.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class EmployeesController : ControllerBase
//    {
//        private readonly IEmployeeService _employeeService;

//        public EmployeesController(IEmployeeService employeeService)
//        {
//            _employeeService = employeeService;
//        }

//        /// <summary>
//        /// שליפת רשימת עובדים לפי פרמטרים.
//        /// </summary>
//        [HttpGet]
//        public async Task<ActionResult<List<EmployeeListItemDto>>> GetEmployees(
//            [FromQuery] int? year,
//            [FromQuery] string? managerName,
//            [FromQuery] string? professionalCategory,
//            [FromQuery] string? systemId,
//            [FromQuery] string? search)
//        {
//            try
//            {
//                var employees = await _employeeService.GetEmployeesAsync(
//                    year,
//                    managerName,
//                    professionalCategory,
//                    systemId,
//                    search);
//                return Ok(employees);
//            }
//            catch (Exception ex)
//            {
//                return StatusCode(500, $"Error: {ex.Message}");
//            }
//        }

//        /// <summary>
//        /// שליפת פרטי עובד ספציפי לפי מזהה.
//        /// </summary>
//        [HttpGet("{id}")]
//        public async Task<ActionResult<EmployeeDetailsDto>> GetEmployeeById(string id)
//        {
//            try
//            {
//                var employee = await _employeeService.GetEmployeeByIdAsync(id);
//                if (employee is null)
//                {
//                    return NotFound();
//                }

//                return Ok(employee);
//            }
//            catch (Exception ex)
//            {
//                return StatusCode(500, $"Error: {ex.Message}");
//            }
//        }

//        /// <summary>
//        /// עדכון חודשי עבודה בפועל עבור הקצאת עובד למערכת.
//        /// </summary>
//        [HttpPut("{id}/allocation-months")]
//        public async Task<IActionResult> UpdateAllocationMonths(
//            string id,
//            [FromQuery] string? systemId,
//            [FromQuery] string? roleInSystem,
//            [FromQuery] int? actualMonths)
//        {
//            if (string.IsNullOrWhiteSpace(systemId) || string.IsNullOrWhiteSpace(roleInSystem) || !actualMonths.HasValue)
//            {
//                return BadRequest("Required parameters: systemId, roleInSystem, and actualMonths must be provided.");
//            }

//            var success = await _employeeService.UpdateAllocationActualMonthsAsync(id, systemId, roleInSystem, actualMonths.Value);

//            if (!success)
//                return NotFound("Employee allocation was not found for the specified system and role.");

//            return Ok(new { message = $"Actual months updated to {actualMonths}." });
//        }

//        /// <summary>
//        /// יצירת עובד חדש.
//        /// </summary>
//        [HttpPost]
//        public async Task<ActionResult<string>> CreateEmployee([FromBody] EmployeeCreateDto dto)
//        {
//            var id = await _employeeService.CreateEmployeeAsync(dto);
//            return CreatedAtAction(nameof(GetEmployeeById), new { id }, id);
//        }

//        /// <summary>
//        /// עדכון עובד קיים.
//        /// </summary>
//        [HttpPut("{id}")]
//        public async Task<IActionResult> UpdateEmployee(string id, [FromBody] EmployeeEditDto dto)
//        {
//            var success = await _employeeService.UpdateEmployeeAsync(id, dto);
//            if (!success) return NotFound("Employee not found or no changes were made.");
//            return NoContent();
//        }

//        /// <summary>
//        /// הוספת הקצאה לעובד קיים.
//        /// </summary>
//        [HttpPost("{id}/allocations")]
//        public async Task<IActionResult> AddAllocation(string id, [FromBody] AllocationCreateDto dto)
//        {
//            var success = await _employeeService.AddAllocationAsync(id, dto);
//            if (!success) return NotFound("Employee not found or could not add allocation.");
//            return Ok();
//        }

//        /// <summary>
//        /// מחיקה רכה של עובד (שינוי סטטוס ללא פעיל).
//        /// </summary>
//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeleteEmployee(string id)
//        {
//            var success = await _employeeService.DeleteEmployeeAsync(id);
//            if (!success) return NotFound("Employee not found.");
//            return NoContent();
//        }
//    }
//}

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

        /// <summary>
        /// שליפת רשימת עובדים לפי פרמטרים.
        /// </summary>
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

        /// <summary>
        /// שליפת עובדים אפשריים לשיבוץ למערכת.
        /// מיועד ל-Drawer של שיבוץ עובדים מתוך פרופיל מערכת.
        /// </summary>
        [HttpGet("assignment-candidates")]
        public async Task<ActionResult<List<EmployeeAssignmentCandidateDto>>> GetAssignmentCandidates(
            [FromQuery] string systemId,
            [FromQuery] int? year,
            [FromQuery] string? search)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(systemId))
                    return BadRequest("systemId is required.");

                var employees = await _employeeService.GetAssignmentCandidatesAsync(systemId, year, search);

                return Ok(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        /// <summary>
        /// שליפת פרטי עובד ספציפי לפי מזהה.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDetailsDto>> GetEmployeeById(string id)
        {
            try
            {
                var employee = await _employeeService.GetEmployeeByIdAsync(id);

                if (employee is null)
                    return NotFound();

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        /// <summary>
        /// עדכון חודשי עבודה בפועל עבור הקצאת עובד למערכת.
        /// </summary>
        [HttpPut("{id}/allocation-months")]
        public async Task<IActionResult> UpdateAllocationMonths(
            string id,
            [FromQuery] string? systemId,
            [FromQuery] string? roleInSystem,
            [FromQuery] int? actualMonths)
        {
            if (string.IsNullOrWhiteSpace(systemId) ||
                string.IsNullOrWhiteSpace(roleInSystem) ||
                !actualMonths.HasValue)
            {
                return BadRequest("Required parameters: systemId, roleInSystem, and actualMonths must be provided.");
            }

            var success = await _employeeService.UpdateAllocationActualMonthsAsync(
                id,
                systemId,
                roleInSystem,
                actualMonths.Value);

            if (!success)
                return NotFound("Employee allocation was not found for the specified system and role.");

            return Ok(new { message = $"Actual months updated to {actualMonths}." });
        }

        /// <summary>
        /// יצירת עובד חדש.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<string>> CreateEmployee([FromBody] EmployeeCreateDto dto)
        {
            var id = await _employeeService.CreateEmployeeAsync(dto);
            return CreatedAtAction(nameof(GetEmployeeById), new { id }, id);
        }

        /// <summary>
        /// עדכון עובד קיים.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(string id, [FromBody] EmployeeEditDto dto)
        {
            var success = await _employeeService.UpdateEmployeeAsync(id, dto);

            if (!success)
                return NotFound("Employee not found or no changes were made.");

            return NoContent();
        }

        /// <summary>
        /// הוספת הקצאה לעובד קיים.
        /// </summary>
        [HttpPost("{id}/allocations")]
        public async Task<IActionResult> AddAllocation(string id, [FromBody] AllocationCreateDto dto)
        {
            var success = await _employeeService.AddAllocationAsync(id, dto);

            if (!success)
                return BadRequest("Employee not found, already assigned, inactive, or does not have enough remaining months.");

            return Ok();
        }

        /// <summary>
        /// שיבוץ כמה עובדים למערכת בפעולה אחת.
        /// </summary>
        [HttpPost("bulk-assign")]
        public async Task<IActionResult> BulkAssignEmployees([FromBody] BulkAssignEmployeesDto dto)
        {
            var result = await _employeeService.BulkAssignEmployeesToSystemAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// מחיקה רכה של עובד.
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(string id)
        {
            var success = await _employeeService.DeleteEmployeeAsync(id);

            if (!success)
                return NotFound("Employee not found.");

            return NoContent();
        }
    }
}