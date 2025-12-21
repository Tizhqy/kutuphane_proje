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
        public async Task<ActionResult<IEnumerable<UyeListDto>>> GetUyeler()
        {
            var uyeler = await _context.Uyeler.ToListAsync();
            var sonuc = new List<UyeListDto>(uyeler.Count);

            foreach (var uye in uyeler)
            {
                var roller = await (from ur in _context.UyeRolleri
                                    join r in _context.Roller on ur.RolId equals r.Id
                                    where ur.UyeId == uye.Id
                                    select r.RolAdi).ToListAsync();

                var rolIsimleri = string.Join(", ", roller);
                if (string.IsNullOrWhiteSpace(rolIsimleri)) rolIsimleri = "Öğrenci";

                sonuc.Add(new UyeListDto
                {
                    Id = uye.Id,
                    AdSoyad = uye.AdSoyad,
                    Email = uye.Email,
                    Telefon = uye.Telefon,
                    OgrenciNo = uye.OgrenciNo,
                    Durum = uye.Durum,
                    KayitTarihi = uye.KayitTarihi,
                    RolIsimleri = rolIsimleri
                });
            }

            return Ok(sonuc);
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