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

    [HttpGet("subcategories")]
    public async Task<ActionResult<List<CategorySubcategoryDto>>> GetSubcategories(
        [FromQuery] string? search,
        [FromQuery] string? parentCategoryId)
    {
        if (!string.IsNullOrWhiteSpace(parentCategoryId) && !ObjectId.TryParse(parentCategoryId, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        var rows = await _categoryService.GetSubcategoriesAsync(search, parentCategoryId);
        return Ok(rows);
    }

    [HttpPost("subcategories")]
    public async Task<ActionResult<CategorySubcategoryDto>> CreateSubcategory([FromBody] CategorySubcategoryCreateDto dto)
    {
        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        if (!ObjectId.TryParse(dto.ParentCategoryId, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        var name = dto.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Subcategory name is required.");
        }

        try
        {
            var result = await _categoryService.CreateSubcategoryAsync(new CategorySubcategoryCreateDto
            {
                ParentCategoryId = dto.ParentCategoryId,
                Name = name
            });

            if (!result.Found || result.Subcategory is null)
            {
                return NotFound("Category not found.");
            }

            return Ok(result.Subcategory);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while creating subcategory.");
        }
    }

    [HttpPut("subcategories/{subcategoryId}")]
    public async Task<ActionResult<CategorySubcategoryDto>> UpdateSubcategory(
        string subcategoryId,
        [FromBody] CategorySubcategoryUpdateDto dto)
    {
        if (!ObjectId.TryParse(subcategoryId, out _))
        {
            return BadRequest("Subcategory id is invalid.");
        }

        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        if (!ObjectId.TryParse(dto.ParentCategoryId, out _))
        {
            return BadRequest("Category id is invalid.");
        }

        var name = dto.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Subcategory name is required.");
        }

        try
        {
            var result = await _categoryService.UpdateSubcategoryAsync(subcategoryId, new CategorySubcategoryUpdateDto
            {
                ParentCategoryId = dto.ParentCategoryId,
                Name = name
            });

            if (!result.Found)
            {
                return NotFound("Subcategory not found.");
            }

            if (result.Conflict)
            {
                return Conflict(result.ConflictMessage);
            }

            return Ok(result.Subcategory);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while updating subcategory.");
        }
    }

    [HttpDelete("subcategories/{subcategoryId}")]
    public async Task<IActionResult> DeactivateSubcategory(string subcategoryId)
    {
        if (!ObjectId.TryParse(subcategoryId, out _))
        {
            return BadRequest("Subcategory id is invalid.");
        }

        try
        {
            var result = await _categoryService.DeactivateSubcategoryAsync(subcategoryId);

            if (!result.Found)
            {
                return NotFound("Subcategory not found.");
            }

            if (result.Conflict)
            {
                return Conflict(result.ConflictMessage);
            }

            return NoContent();
        }
        catch
        {
            return StatusCode(500, "Unexpected error occurred while deactivating subcategory.");
        }
    }
}