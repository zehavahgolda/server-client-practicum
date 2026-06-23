using Microsoft.AspNetCore.Mvc;
using HR_System.Models;
using HR_System.Services;

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
    public async Task<ActionResult<List<Category>>> GetCategories() =>
        Ok(await _categoryService.GetAllCategoriesAsync());

    [HttpPost]
    public async Task<IActionResult> Create(Category category)
    {
        await _categoryService.CreateCategoryAsync(category);
        return Ok();
    }
}