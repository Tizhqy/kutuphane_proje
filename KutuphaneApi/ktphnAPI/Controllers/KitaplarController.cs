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

        [HttpGet("public")]
        [Authorize]
        public async Task<IActionResult> GetPublicKitaplar([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 20;
                if (pageSize > 100) pageSize = 100;

                var total = await _context.Kitaplar.CountAsync();

                var kitaplar = await _context.Kitaplar
                    .OrderBy(k => k.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var hasMore = page * pageSize < total;

                return Ok(new { 
                    success = true, 
                    total, 
                    page, 
                    pageSize, 
                    hasMore,
                    data = kitaplar 
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("public/search")]
        [Authorize]
        public async Task<IActionResult> SearchKitaplar(
            [FromQuery] string? q,           // Arama metni
            [FromQuery] string? kategori,    // Kategori filtresi
            [FromQuery] string? durum,       // Durum filtresi
            [FromQuery] int? minYil,         // Min yayın yılı
            [FromQuery] int? maxYil,         // Max yayın yılı
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 20;
                if (pageSize > 100) pageSize = 100;

                var query = _context.Kitaplar.AsQueryable();

                // Arama metni filtreleme
                if (!string.IsNullOrWhiteSpace(q))
                {
                    query = query.Where(k => 
                        k.KitapAdi.Contains(q) || 
                        k.Yazar.Contains(q) || 
                        k.Isbn.Contains(q));
                }

                // Kategori filtreleme
                if (!string.IsNullOrWhiteSpace(kategori))
                {
                    query = query.Where(k => k.Kategori == kategori);
                }

                // Durum filtreleme
                if (!string.IsNullOrWhiteSpace(durum))
                {
                    query = query.Where(k => k.Durum == durum);
                }

                // Yıl aralığı filtreleme
                if (minYil.HasValue && maxYil.HasValue)
                {
                    query = query.Where(k => k.YayinYili.HasValue && k.YayinYili.Value >= minYil.Value && k.YayinYili.Value <= maxYil.Value);
                }
                else if (minYil.HasValue)
                {
                    // Sadece min verilirse: max olarak DB'deki en büyük yıl alınır
                    var max = await _context.Kitaplar.Where(k => k.YayinYili.HasValue).MaxAsync(k => k.YayinYili) ?? int.MaxValue;
                    query = query.Where(k => k.YayinYili.HasValue && k.YayinYili.Value >= minYil.Value && k.YayinYili.Value <= max);
                }
                else if (maxYil.HasValue)
                {
                    query = query.Where(k => k.YayinYili.HasValue && k.YayinYili.Value <= maxYil.Value);
                }

                var total = await query.CountAsync();

                var kitaplar = await query
                    .OrderBy(k => k.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var hasMore = page * pageSize < total;

                return Ok(new { 
                    success = true, 
                    total, 
                    page, 
                    pageSize, 
                    hasMore,
                    data = kitaplar 
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Arama yapılırken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("public/distinct-kategoriler")]
        [Authorize]
        public async Task<IActionResult> GetDistinctKategoriler()
        {
            try
            {
                var kategoriler = await _context.Kitaplar
                    .Where(k => !string.IsNullOrWhiteSpace(k.Kategori))
                    .Select(k => k.Kategori.Trim())
                    .Distinct()
                    .OrderBy(k => k)
                    .ToListAsync();
                return Ok(new { success = true, total = kategoriler.Count, data = kategoriler });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Kategoriler alınırken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("public/yil-araligi")]
        [Authorize]
        public async Task<IActionResult> GetYilAraligi()
        {
            try
            {
                var min = await _context.Kitaplar.Where(k => k.YayinYili.HasValue).MinAsync(k => k.YayinYili);
                var max = await _context.Kitaplar.Where(k => k.YayinYili.HasValue).MaxAsync(k => k.YayinYili);
                return Ok(new { success = true, min = min, max = max });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Yıl aralığı alınırken hata oluştu.", detail = ex.Message });
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
                // EklemeTarihi boşsa bugünün tarihini ata
                if (kitap.EklemeTarihi == default || kitap.EklemeTarihi == DateTime.MinValue)
                {
                    kitap.EklemeTarihi = DateTime.Now;
                }
                
                _context.Kitaplar.Add(kitap);
                await _context.SaveChangesAsync();
                return CreatedAtAction("GetKitap", new { id = kitap.Id }, new { success = true, data = kitap });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Kitap kaydedilemedi.", detail = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> PutKitap(int id, [FromBody] Kitap kitap)
        {
            if (kitap == null || id != kitap.Id)
                return BadRequest(new { success = false, message = "Geçersiz kitap verisi." });

            try
            {
                var existingKitap = await _context.Kitaplar.FindAsync(id);
                if (existingKitap == null)
                    return NotFound(new { success = false, message = "Kitap bulunamadı." });

                existingKitap.KitapAdi = kitap.KitapAdi;
                existingKitap.Yazar = kitap.Yazar;
                existingKitap.Kategori = kitap.Kategori;
                existingKitap.Isbn = kitap.Isbn;
                existingKitap.Durum = kitap.Durum;

                _context.Kitaplar.Update(existingKitap);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap güncellendi.", data = existingKitap });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Kitap güncellenirken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteKitap(int id)
        {
            try
            {
                var kitap = await _context.Kitaplar.FindAsync(id);
                if (kitap == null)
                    return NotFound(new { success = false, message = "Kitap bulunamadı." });

                _context.Kitaplar.Remove(kitap);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap silindi." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Kitap silinirken hata oluştu.", detail = ex.Message });
            }
        }
    }
} 