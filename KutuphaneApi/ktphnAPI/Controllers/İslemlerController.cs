using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

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
        [Authorize(Roles = "admin")]
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
        [Authorize(Roles = "admin")]
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

        // Kullanıcının ödünç aldığı kitapları listele
        [HttpGet("benim-kitaplarim")]
        [Authorize]
        public async Task<IActionResult> BenimKitaplarım()
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                var islemler = await _context.İslemler
                    .Where(i => i.UyeId == uyeId && i.İslemTuru == "odunc" && i.IadeTarihi == null)
                    .ToListAsync();

                return Ok(new { success = true, total = islemler.Count, data = islemler });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Kitap ödünç al
        [HttpPost("odunc-al")]
        [Authorize]
        public async Task<IActionResult> OduncAl([FromBody] OduncAlRequest request)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                // Kitabın var mı ve mevcut mu kontrol et
                var kitap = await _context.Kitaplar.FindAsync(request.KitapId);
                if (kitap == null || kitap.Durum != "mevcut")
                {
                    return BadRequest(new { success = false, message = "Kitap mevcut değil!" });
                }

                // Kullanıcı zaten bu kitabı ödünç almış mı kontrol et
                var mevcutOdunc = await _context.İslemler
                    .FirstOrDefaultAsync(i => i.UyeId == uyeId && i.KitapId == request.KitapId && i.İslemTuru == "odunc" && i.IadeTarihi == null);
                if (mevcutOdunc != null)
                {
                    return BadRequest(new { success = false, message = "Bu kitabı zaten ödünç almışsınız!" });
                }

                // İşlem ekle
                var islem = new İslemler
                {
                    UyeId = uyeId,
                    KitapId = request.KitapId,
                    İslemTuru = "odunc",
                    AlimTarihi = DateTime.UtcNow,
                    Durum = "aktif",
                    OlusturmaTarihi = DateTime.UtcNow
                };

                _context.İslemler.Add(islem);

                // Kitabı "odunc" yap (trigger veya manuel)
                kitap.Durum = "odunc";
                _context.Kitaplar.Update(kitap);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap başarıyla ödünç alındı.", data = islem });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

        // Kitap iade et
        [HttpPost("iade-et")]
        [Authorize]
        public async Task<IActionResult> IadeEt([FromBody] IadeEtRequest request)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                // İşlemi bul
                var islem = await _context.İslemler
                    .FirstOrDefaultAsync(i => i.Id == request.IslemId && i.UyeId == uyeId && i.İslemTuru == "odunc" && i.IadeTarihi == null);
                if (islem == null)
                {
                    return NotFound(new { success = false, message = "İşlem bulunamadı!" });
                }

                // İşlemi güncelle
                islem.IadeTarihi = DateTime.UtcNow;
                islem.Durum = "tamamlandi";
                _context.İslemler.Update(islem);

                // Kitabı "mevcut" yap
                var kitap = await _context.Kitaplar.FindAsync(islem.KitapId);
                if (kitap != null)
                {
                    kitap.Durum = "mevcut";
                    _context.Kitaplar.Update(kitap);
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap başarıyla iade edildi." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

        // Geç kalan kitapları listele
        [HttpGet("geciken")]
        [Authorize]
        public async Task<IActionResult> Geciken()
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                int? uyeId = null;
                
                if (!string.IsNullOrEmpty(uyeIdClaim) && int.TryParse(uyeIdClaim, out int parsedUyeId))
                {
                    uyeId = parsedUyeId;
                }

                var rol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "ogrenci";
                bool isAdmin = rol.Contains("admin");

                // Admin tüm gecikenleri görebilir, user sadece kendisini
                var query = _context.İslemler
                    .Where(i => i.İslemTuru == "odunc" && i.IadeTarihi == null && i.AlimTarihi.HasValue)
                    .Where(i => i.AlimTarihi.Value.AddDays(14) < DateTime.UtcNow);

                if (!isAdmin && uyeId.HasValue)
                {
                    query = query.Where(i => i.UyeId == uyeId.Value);
                }

                var geciken = await query.ToListAsync();

                return Ok(new { success = true, total = geciken.Count, data = geciken });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }
    }

    // DTOs
    public class OduncAlRequest
    {
        public int KitapId { get; set; }
    }

    public class IadeEtRequest
    {
        public int IslemId { get; set; }
    }
}