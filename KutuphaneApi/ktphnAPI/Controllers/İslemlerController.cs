// global commit
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using ktphnAPI.Services;
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
        private readonly IEmailService _emailService;

        public İslemlerController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Getİslemler([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? durum = null, [FromQuery] int? uyeId = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 20;
                if (pageSize > 100) pageSize = 100;

                var query = _context.İslemler.AsQueryable();

                if (!string.IsNullOrEmpty(durum)) query = query.Where(i => i.Durum == durum);
                if (uyeId.HasValue) query = query.Where(i => i.UyeId == uyeId.Value);

                var total = await query.CountAsync();

                var islemler = await query
                    .OrderByDescending(i => i.OlusturmaTarihi)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Join(_context.Kitaplar, i => i.KitapId, k => k.Id, (i, k) => new { Islem = i, Kitap = k })
                    .Join(_context.Uyeler, ik => ik.Islem.UyeId, u => u.Id, (ik, u) => new
                    {
                        ik.Islem.Id,
                        ik.Islem.UyeId,
                        UyeAdSoyad = u.AdSoyad,
                        ik.Islem.KitapId,
                        KitapAdi = ik.Kitap.KitapAdi,
                        Yazar = ik.Kitap.Yazar,
                        ik.Islem.İslemTuru,
                        ik.Islem.AlimTarihi,
                        ik.Islem.IadeTarihi,
                        ik.Islem.Durum,
                        ik.Islem.UserAgent,
                        ik.Islem.IpAddress,
                        ik.Islem.Metadata,
                        ik.Islem.OlusturmaTarihi
                    })
                    .ToListAsync();

                var hasMore = page * pageSize < total;
                return Ok(new { success = true, total, page, pageSize, hasMore, data = islemler });
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
                    .Join(_context.Kitaplar, i => i.KitapId, k => k.Id, (i, k) => new
                    {
                        i.Id,
                        i.UyeId,
                        i.KitapId,
                        KitapAdi = k.KitapAdi,
                        Yazar = k.Yazar,
                        i.AlimTarihi,
                        i.IadeTarihi,
                        i.Durum,
                        i.İslemTuru
                    })
                    .ToListAsync();

                return Ok(new { success = true, total = islemler.Count, data = islemler });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("toplam-okudugum")]
        [Authorize]
        public async Task<IActionResult> ToplamOkudugum()
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                var totalRead = await _context.İslemler
                    .Where(i => i.UyeId == uyeId && i.İslemTuru == "odunc" && i.IadeTarihi != null)
                    .CountAsync();

                return Ok(new { success = true, total = totalRead });
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
            // Transaction ile pessimistic locking - aynı anda iki kişinin aynı kitabı almasını engeller
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                // FOR UPDATE ile kitabı kilitle - başka transaction beklemek zorunda kalır
                var kitap = await _context.Kitaplar
                    .FromSqlRaw("SELECT * FROM kitaplar WHERE kitap_id = {0} FOR UPDATE", request.KitapId)
                    .FirstOrDefaultAsync();
                    
                if (kitap == null || kitap.Durum != "musait")
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { success = false, message = "Kitap mevcut değil veya başkası tarafından alındı!" });
                }

                var mevcutOdunc = await _context.İslemler
                    .FirstOrDefaultAsync(i => i.UyeId == uyeId && i.KitapId == request.KitapId && i.İslemTuru == "odunc" && i.IadeTarihi == null);
                if (mevcutOdunc != null)
                {
                    await transaction.RollbackAsync();
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
                
                // NOT: Kitap durumu trigger tarafından güncelleniyor (kitap_odunc_after_insert)
                // kitap.Durum = "odunc";
                // _context.Kitaplar.Update(kitap);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Mail gönder (kullanıcı bilgilerini al)
                var uye = await _context.Uyeler.FindAsync(uyeId);
                if (uye != null && !string.IsNullOrWhiteSpace(uye.Email))
                {
                    var iadeTarihi = DateTime.UtcNow.AddDays(14); // 14 gün sonra iade
                    try
                    {
                        await _emailService.SendOduncAlBildirimAsync(
                            uye.Email,
                            uye.AdSoyad,
                            kitap.KitapAdi,
                            iadeTarihi
                        );
                    }
                    catch (System.Exception mailEx)
                    {
                        // Mail hatası işlemi engellemesin, sadece log'la
                        // Mail gönderilemese bile ödünç alma işlemi başarılı
                    }
                }

                return Ok(new { success = true, message = "Kitap başarıyla ödünç alındı.", data = islem });
            }
            catch (System.Exception ex)
            {
                await transaction.RollbackAsync();
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

                islem.IadeTarihi = DateTime.UtcNow;
                islem.Durum = "iade";
                _context.İslemler.Update(islem);

                // Başka ödünç kaydı yoksa kitabı mevcut yap
                var otherLoanExists = await _context.İslemler
                    .AnyAsync(i => i.KitapId == islem.KitapId && 
                                   i.İslemTuru == "odunc" && 
                                   i.IadeTarihi == null && 
                                   i.Id != islem.Id);

                // NOT: Kitap durumu trigger tarafından güncelleniyor (kitap_iade_after_update)
                // if (!otherLoanExists)
                // {
                //     var kitap = await _context.Kitaplar.FindAsync(islem.KitapId);
                //     if (kitap != null)
                //     {
                //         kitap.Durum = "musait";
                //         _context.Kitaplar.Update(kitap);
                //     }
                // }

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
        public async Task<IActionResult> Geciken([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 50;
                if (pageSize > 200) pageSize = 200;

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
                    .Where(i => i.AlimTarihi != null && i.AlimTarihi.Value.AddDays(14) < DateTime.UtcNow);

                if (!isAdmin && uyeId.HasValue)
                {
                    query = query.Where(i => i.UyeId == uyeId.Value);
                }

                var total = await query.CountAsync();

                // Tek sorguda kitap ve üye bilgisi ile birlikte al
                var geciken = await query
                    .OrderByDescending(i => i.AlimTarihi)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Join(_context.Kitaplar, i => i.KitapId, k => k.Id, (i, k) => new { Islem = i, Kitap = k })
                    .Join(_context.Uyeler, ik => ik.Islem.UyeId, u => u.Id, (ik, u) => new
                    {
                        ik.Islem.Id,
                        ik.Islem.UyeId,
                        UyeAdSoyad = u.AdSoyad,
                        UyeEmail = u.Email,
                        ik.Islem.KitapId,
                        KitapAdi = ik.Kitap.KitapAdi,
                        Yazar = ik.Kitap.Yazar,
                        ik.Islem.AlimTarihi,
                        SonIadeTarihi = ik.Islem.AlimTarihi.HasValue ? ik.Islem.AlimTarihi.Value.AddDays(14) : (DateTime?)null,
                        GecikmeGun = ik.Islem.AlimTarihi.HasValue ? (int)Math.Ceiling((DateTime.UtcNow - ik.Islem.AlimTarihi.Value.AddDays(14)).TotalDays) : 0
                    })
                    .ToListAsync();

                var hasMore = page * pageSize < total;
                return Ok(new { success = true, total, page, pageSize, hasMore, data = geciken });
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