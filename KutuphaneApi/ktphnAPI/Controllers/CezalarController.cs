using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using ktphnAPI.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CezalarController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CezalarController> _logger;

        public CezalarController(AppDbContext context, ILogger<CezalarController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Kullanıcının cezalarını listele
        [HttpGet("benim-cezalarim")]
        [Authorize]
        public async Task<IActionResult> MyPenalties([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                    return Unauthorized(new { success = false, message = "Kimlik doğrulama hatası" });

                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                var total = await _context.CezaIslemleri
                    .Where(c => c.UyeId == uyeId)
                    .CountAsync();

                var cezalar = await _context.CezaIslemleri
                    .Where(c => c.UyeId == uyeId)
                    .OrderByDescending(c => c.CezaTarihi)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new
                    {
                        c.Id,
                        c.CezaTuru,
                        c.CezaTarihi,
                        c.SonOdemeTarihi,
                        c.OdemeTarihi,
                        c.CezaTutari,
                        c.Durum,
                        c.Aciklama,
                        KitapAdi = c.Kitap.KitapAdi,
                        Yazar = c.Kitap.Yazar
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    hasMore = page * pageSize < total,
                    data = cezalar
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Ceza listesi hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Cezalar alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Admin: Tüm cezaları listele
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllPenalties([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? durum = null, [FromQuery] int? uyeId = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 20;
                if (pageSize > 100) pageSize = 100;

                var query = _context.CezaIslemleri.AsQueryable();

                if (!string.IsNullOrEmpty(durum))
                    query = query.Where(c => c.Durum == durum);

                if (uyeId.HasValue)
                    query = query.Where(c => c.UyeId == uyeId.Value);

                var total = await query.CountAsync();

                var cezalar = await query
                    .OrderByDescending(c => c.CezaTarihi)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new
                    {
                        c.Id,
                        UyeAdSoyad = c.Uye.AdSoyad,
                        c.UyeId,
                        c.CezaTuru,
                        KitapAdi = c.Kitap.KitapAdi,
                        c.CezaTarihi,
                        c.SonOdemeTarihi,
                        c.OdemeTarihi,
                        c.CezaTutari,
                        c.Durum,
                        c.Aciklama
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    hasMore = page * pageSize < total,
                    data = cezalar
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Admin ceza listesi hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Cezalar alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Ceza detaylarını göster
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPenaltyDetail(int id)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(uyeIdClaim, out int uyeId))
                    return Unauthorized();

                var ceza = await _context.CezaIslemleri
                    .Where(c => c.Id == id && (c.UyeId == uyeId || User.IsInRole("admin")))
                    .Include(c => c.Uye)
                    .Include(c => c.Kitap)
                    .FirstOrDefaultAsync();

                if (ceza == null)
                    return NotFound(new { success = false, message = "Ceza bulunamadı" });

                return Ok(new { success = true, data = ceza });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Detay alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Ceza ödeme işlemi
        [HttpPost("{id}/ode")]
        [Authorize]
        public async Task<IActionResult> PayPenalty(int id)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(uyeIdClaim, out int uyeId))
                    return Unauthorized();

                var ceza = await _context.CezaIslemleri.FirstOrDefaultAsync(c => c.Id == id && c.UyeId == uyeId);

                if (ceza == null)
                    return NotFound(new { success = false, message = "Ceza bulunamadı" });

                if (ceza.OdemeTarihi.HasValue)
                    return BadRequest(new { success = false, message = "Bu ceza zaten ödenmiş" });

                ceza.OdemeTarihi = DateTime.UtcNow;
                ceza.Durum = "odemendi";
                ceza.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Ceza ödendi - UyeId: {uyeId}, CezaId: {id}, Tutar: {ceza.CezaTutari}");

                return Ok(new { success = true, message = "Ceza ödemesi tamamlandı", data = ceza });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Ceza ödeme hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Ödeme işlemi sırasında hata oluştu.", detail = ex.Message });
            }
        }

        // Admin: Ceza affetme
        [HttpPost("{id}/affe")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> PardonPenalty(int id, [FromBody] string? neden = null)
        {
            try
            {
                var ceza = await _context.CezaIslemleri.FirstOrDefaultAsync(c => c.Id == id);

                if (ceza == null)
                    return NotFound(new { success = false, message = "Ceza bulunamadı" });

                ceza.Durum = "afedildi";
                ceza.Aciklama = $"Affedildi. Neden: {neden ?? "Belirtilmemiş"}";
                ceza.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Ceza affedildi - CezaId: {id}");

                return Ok(new { success = true, message = "Ceza affedildi", data = ceza });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Ceza affetme hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Affetme işlemi sırasında hata oluştu.", detail = ex.Message });
            }
        }

        // Admin: Ceza silme (hard delete)
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeletePenalty(int id)
        {
            try
            {
                var ceza = await _context.CezaIslemleri.FirstOrDefaultAsync(c => c.Id == id);
                if (ceza == null)
                    return NotFound(new { success = false, message = "Ceza bulunamadı" });

                _context.CezaIslemleri.Remove(ceza);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Ceza silindi - CezaId: {id}");
                return Ok(new { success = true, message = "Ceza silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Ceza silme hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Ceza silinirken hata oluştu.", detail = ex.Message });
            }
        }

        // Ceza konfigürasyonu getir
        [HttpGet("config/all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetConfig()
        {
            try
            {
                var configs = await _context.CezaKonfigurasyonu.ToListAsync();
                return Ok(new { success = true, data = configs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Konfigürasyon alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Ceza konfigürasyonu güncelle
        [HttpPut("config/{key}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateConfig(string key, [FromBody] dynamic value)
        {
            try
            {
                var config = await _context.CezaKonfigurasyonu
                    .FirstOrDefaultAsync(c => c.ConfigKey == key);

                if (config == null)
                    return NotFound(new { success = false, message = "Konfigürasyon bulunamadı" });

                config.ConfigValue = value.ToString();
                config.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Ceza konfigürasyonu güncellendi - Key: {key}, Value: {config.ConfigValue}");

                return Ok(new { success = true, message = "Konfigürasyon güncellendi", data = config });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Konfigürasyon güncelleme hatası: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Konfigürasyon güncellenirken hata oluştu.", detail = ex.Message });
            }
        }

        // Toplam ceza tutarı (kullanıcı)
        [HttpGet("toplamim")]
        [Authorize]
        public async Task<IActionResult> MyTotalPenalty()
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(uyeIdClaim, out int uyeId))
                    return Unauthorized();

                var toplamCeza = await _context.CezaIslemleri
                    .Where(c => c.UyeId == uyeId && c.Durum == "aktif")
                    .SumAsync(c => c.CezaTutari);

                var aktivCezaSayisi = await _context.CezaIslemleri
                    .Where(c => c.UyeId == uyeId && c.Durum == "aktif")
                    .CountAsync();

                return Ok(new
                {
                    success = true,
                    toplamCezaTutari = toplamCeza,
                    aktivCezaSayisi = aktivCezaSayisi
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Ceza toplamı hesaplanırken hata oluştu.", detail = ex.Message });
            }
        }

        // TEST ENDPOINT: Email Gönder (Admin)
        [HttpPost("test-email/{email}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> SendTestEmail(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                    return BadRequest(new { success = false, message = "Email adresi gereklidir." });

                // EmailService'i DI container'dan al
                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
                
                await emailService.SendTestEmailAsync(email);

                return Ok(new
                {
                    success = true,
                    message = $"Test emaili {email} adresine gönderildi."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Test email gönderme hatası: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Email gönderme hatası oluştu.",
                    detail = ex.Message
                });
            }
        }
    }
}
