using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

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

                var kitap = await _context.Kitaplar.FindAsync(request.KitapId);
                if (kitap == null || (kitap.Durum != "mevcut" && kitap.Durum != "musait"))
                {
                    return BadRequest(new { success = false, message = "Kitap mevcut değil!" });
                }

                var mevcutOdunc = await _context.İslemler
                    .FirstOrDefaultAsync(i => i.UyeId == uyeId && i.KitapId == request.KitapId && i.İslemTuru == "odunc" && i.IadeTarihi == null);
                if (mevcutOdunc != null)
                {
                    return BadRequest(new { success = false, message = "Bu kitabı zaten ödünç almışsınız!" });
                }

                var remoteIp = HttpContext.Connection?.RemoteIpAddress?.MapToIPv4()?.ToString() ?? string.Empty;
                var userAgent = Request.Headers["User-Agent"].ToString();
                var meta = new { action = "odunc-al", source = "api", createdAt = DateTime.UtcNow };

                var islem = new İslemler
                {
                    UyeId = uyeId,
                    KitapId = request.KitapId,
                    İslemTuru = "odunc",
                    AlimTarihi = DateTime.UtcNow,
                    Durum = "odunc",
                    OlusturmaTarihi = DateTime.UtcNow,
                    UserAgent = userAgent,
                    IpAddress = remoteIp,
                    Metadata = JsonSerializer.Serialize(meta)
                };

                _context.İslemler.Add(islem);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap başarıyla ödünç alındı.", data = islem });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

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

                var islem = await _context.İslemler
                    .FirstOrDefaultAsync(i => i.Id == request.IslemId && i.UyeId == uyeId && i.İslemTuru == "odunc" && i.IadeTarihi == null);
                if (islem == null)
                {
                    return NotFound(new { success = false, message = "İşlem bulunamadı!" });
                }

                var remoteIp = HttpContext.Connection?.RemoteIpAddress?.MapToIPv4()?.ToString() ?? string.Empty;
                var userAgent = Request.Headers["User-Agent"].ToString();
                var meta = new { action = "iade-et", source = "api", updatedAt = DateTime.UtcNow };

                islem.IadeTarihi = DateTime.UtcNow;
                islem.Durum = "iade";
                islem.UserAgent = userAgent;
                islem.IpAddress = remoteIp;
                islem.Metadata = JsonSerializer.Serialize(meta);
                _context.İslemler.Update(islem);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Kitap başarıyla iade edildi." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

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

    public class OduncAlRequest
    {
        public int KitapId { get; set; }
    }

    public class IadeEtRequest
    {
        public int IslemId { get; set; }
    }
}