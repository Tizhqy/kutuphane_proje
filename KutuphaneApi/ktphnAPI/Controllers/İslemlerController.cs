using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ktphnAPI.Controllers
{
    // Use an ASCII route to avoid Unicode controller-name issues (İ vs I)
    [Route("api/islemler")]
    [ApiController]
    public class İslemlerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public İslemlerController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Getİslemler()
        {
            try
            {
                var islemler = await _context.İslemler.ToListAsync();
                return Ok(new { success = true, total = islemler.Count, data = islemler });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> Getİslem(int id)
        {
            try
            {
                var islem = await _context.İslemler.FindAsync(id);
                if (islem == null)
                {
                    return NotFound(new { success = false, message = "İslem bulunamadı." });
                }
                return Ok(new { success = true, data = islem });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İstek işlenirken hata oluştu.", detail = ex.Message });
            }
        }

    }
}