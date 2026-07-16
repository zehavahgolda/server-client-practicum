using Microsoft.AspNetCore.Mvc;
using HR_System.DTOs.Categories;
using HR_System.Services;
using MongoDB.Bson;

[ApiController]
[Route("api/[controller]")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        var category = await _categoryService.GetCategoryDtoByIdAsync(id);

        if (category is null)
        {
            return NotFound("Category not found.");
        }

        return Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryCreateDto dto)
    {
        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        var name = dto.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Category name is required.");
        }

        try
        {
            var createdCategory = await _categoryService.CreateCategoryAsync(new CategoryCreateDto
            {
                Name = name
            });

            return CreatedAtAction(
                nameof(GetCategoryById),
                new { id = createdCategory.Id },
                createdCategory
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while creating category.");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(string id, [FromBody] CategoryUpdateDto dto)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        var name = dto.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Category name is required.");
        }

        try
        {
            var updatedCategory = await _categoryService.UpdateCategoryAsync(id, new CategoryUpdateDto
            {
                Name = name
            });

            if (updatedCategory is null)
            {
                return NotFound("Category not found.");
            }

            return Ok(updatedCategory);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while updating category.");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        try
        {
            var deleted = await _categoryService.SoftDeleteCategoryAsync(id);

            if (!deleted)
            {
                return NotFound("Category not found.");
            }

            return NoContent();
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while deleting category.");
        }
    }
}