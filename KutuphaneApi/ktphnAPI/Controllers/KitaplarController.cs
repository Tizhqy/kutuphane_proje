using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KitaplarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KitaplarController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetKitaplar()
        {
            try
            {
                var kitaplar = await _context.Kitaplar.ToListAsync();
                return Ok(new { success = true, total = kitaplar.Count, data = kitaplar });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Kullanıcıların görebileceği kitap listesi (token gerekli, admin şartı yok)
        [HttpGet("public")]
        [Authorize]
        public async Task<IActionResult> GetPublicKitaplar()
        {
            try
            {
                var kitaplar = await _context.Kitaplar.ToListAsync();
                return Ok(new { success = true, total = kitaplar.Count, data = kitaplar });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }
        
        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetKitap(int id)
        {
            try
            {
                var kitap = await _context.Kitaplar.FindAsync(id);
                if (kitap == null)
                {
                    return NotFound(new { success = false, message = "Kitap bulunamadı." });
                }
                return Ok(new { success = true, data = kitap });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İstek işlenirken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> PostKitap(Kitap kitap)
        {
            if (kitap == null) return BadRequest(new { success = false, message = "Geçersiz kitap verisi." });
            if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Model doğrulaması başarısız.", errors = ModelState });
            try
            {
                _context.Kitaplar.Add(kitap);
                await _context.SaveChangesAsync();
                return CreatedAtAction("GetKitap", new { id = kitap.Id }, new { success = true, data = kitap });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Kitap kaydedilemedi.", detail = ex.Message });
            }
        }
    }
}