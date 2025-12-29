// v1.0 - Dark mode and global versioning comment added
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
    [Authorize(Roles = "admin")]
    public class UyelerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UyelerController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UyeListDto>>> GetUyeler([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var total = await _context.Uyeler.CountAsync();

            // Tek sorguda tüm üyeleri ve rollerini al (N+1 çözümü)
            var uyelerWithRoles = await _context.Uyeler
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .GroupJoin(
                    _context.UyeRolleri.Join(_context.Roller, ur => ur.RolId, r => r.Id, (ur, r) => new { ur.UyeId, r.RolAdi }),
                    u => u.Id,
                    ur => ur.UyeId,
                    (u, roller) => new UyeListDto
                    {
                        Id = u.Id,
                        AdSoyad = u.AdSoyad,
                        Email = u.Email,
                        Telefon = u.Telefon,
                        OgrenciNo = u.OgrenciNo,
                        Durum = u.Durum,
                        KayitTarihi = u.KayitTarihi,
                        RolIsimleri = roller.Any() ? string.Join(", ", roller.Select(r => r.RolAdi)) : "Öğrenci"
                    })
                .ToListAsync();

            var hasMore = page * pageSize < total;
            return Ok(new { success = true, total, page, pageSize, hasMore, data = uyelerWithRoles });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUye(int id)
        {
            try
            {
                var uye = await _context.Uyeler.FindAsync(id);
                if (uye == null)
                    return NotFound(new { success = false, message = "Üye bulunamadı." });

                return Ok(new { success = true, data = uye });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İstek işlenirken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUye(int id, [FromBody] Uye uye)
        {
            if (uye == null || id != uye.Id)
                return BadRequest(new { success = false, message = "Geçersiz üye verisi." });

            try
            {
                var existingUye = await _context.Uyeler.FindAsync(id);
                if (existingUye == null)
                    return NotFound(new { success = false, message = "Üye bulunamadı." });

                existingUye.AdSoyad = uye.AdSoyad;
                existingUye.Email = uye.Email;
                existingUye.Telefon = uye.Telefon;
                existingUye.OgrenciNo = uye.OgrenciNo;
                existingUye.Durum = uye.Durum;

                _context.Uyeler.Update(existingUye);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Üye güncellendi.", data = existingUye });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Üye güncellenirken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUye(int id)
        {
            try
            {
                var uye = await _context.Uyeler.FindAsync(id);
                if (uye == null)
                    return NotFound(new { success = false, message = "Üye bulunamadı." });

                _context.Uyeler.Remove(uye);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Üye silindi." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Üye silinirken hata oluştu.", detail = ex.Message });
            }
        }
    }
}