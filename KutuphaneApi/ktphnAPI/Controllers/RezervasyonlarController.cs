// v1.0 - Dark mode and global versioning comment added
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System;
using Microsoft.Extensions.Logging;

namespace ktphnAPI.Controllers
{ 
    [Route("api/rezervasyonlar")]
    [ApiController]
    [Authorize]
    public class RezervasyonlarController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RezervasyonlarController> _logger;

        public RezervasyonlarController(AppDbContext context, ILogger<RezervasyonlarController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("kitap/{kitapId}")]
        public async Task<IActionResult> GetKitapRezervasyonlari(int kitapId)
        {
            try
            {
                var rezervasyonlar = await _context.Rezervasyonlar
                    .Where(r => r.KitapId == kitapId && r.Durum == "aktif")
                    .OrderBy(r => r.BaslangicTarihi)
                    .ToListAsync();

                _logger.LogInformation("Rezervasyon listesi çekildi | KitapId: {KitapId} | Adet: {Count}", kitapId, rezervasyonlar.Count);

                return Ok(new { success = true, total = rezervasyonlar.Count, data = rezervasyonlar });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Rezervasyon listesi alınırken hata | KitapId: {KitapId}", kitapId);
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateRezervation([FromBody] CreateRezervationRequest request)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                var today = DateTime.UtcNow.Date;
                var startDate = request.BaslangicTarihi.Date;
                var endDate = request.BirisTarihi.Date;

                if (startDate < today)
                {
                    return BadRequest(new { success = false, message = "Geçmiş tarih için rezervasyon yapılamaz." });
                }

                if (request.BaslangicTarihi >= request.BirisTarihi)
                {
                    return BadRequest(new { success = false, message = "Bitiş tarihi başlangıç tarihinden sonra olmalıdır." });
                }

                var kitap = await _context.Kitaplar.FindAsync(request.KitapId);
                if (kitap == null)
                {
                    return NotFound(new { success = false, message = "Kitap bulunamadı." });
                }

                // Kitap ödünçte ise, iade tarihinden önce rezervasyon yapılamaz
                if (kitap.Durum == "odunc")
                {
                    // Aktif ödünç işlemini bul
                    var aktifOdunc = await _context.İslemler
                        .Where(i => i.KitapId == request.KitapId && i.İslemTuru == "odunc" && i.IadeTarihi == null)
                        .OrderByDescending(i => i.AlimTarihi)
                        .FirstOrDefaultAsync();

                    if (aktifOdunc != null && aktifOdunc.AlimTarihi.HasValue)
                    {
                        // İade tarihi = Alım tarihi + 14 gün
                        var beklenenIadeTarihi = aktifOdunc.AlimTarihi.Value.AddDays(14).Date;
                        
                        // Rezervasyon başlangıç tarihi iade tarihinden önce olamaz
                        if (startDate <= beklenenIadeTarihi)
                        {
                            return BadRequest(new { 
                                success = false, 
                                message = $"Bu kitap şu anda ödünçte. En erken {beklenenIadeTarihi.AddDays(1):dd.MM.yyyy} tarihinden itibaren rezervasyon yapabilirsiniz." 
                            });
                        }
                    }
                }

                var hasOverlap = await _context.Rezervasyonlar.AnyAsync(r =>
                    r.KitapId == request.KitapId &&
                    r.Durum == "aktif" &&
                    !(endDate <= r.BaslangicTarihi.Date || startDate >= r.BirisTarihi.Date));

                if (hasOverlap)
                {
                    return Conflict(new { success = false, message = "Bu tarih aralığında aktif bir rezervasyon zaten var." });
                }

                var reservation = new Rezervasyon
                {
                    UyeId = uyeId,
                    KitapId = request.KitapId,
                    BaslangicTarihi = request.BaslangicTarihi,
                    BirisTarihi = request.BirisTarihi,
                    Durum = "aktif",
                    OlusturmaTarihi = DateTime.UtcNow
                };

                _context.Rezervasyonlar.Add(reservation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Rezervasyon oluşturuldu | RezId: {RezId} | UyeId: {UyeId} | KitapId: {KitapId} | {Start} -> {End}",
                    reservation.Id, uyeId, request.KitapId, startDate, endDate);

                return Ok(new { success = true, message = "Rezervasyon başarıyla oluşturuldu.", data = reservation });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Rezervasyon oluşturulurken hata | KitapId: {KitapId} | UyeId: {UyeId}", request?.KitapId, User?.Identity?.Name);
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelRezervation(int id)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                var reservation = await _context.Rezervasyonlar.FindAsync(id);
                if (reservation == null || reservation.UyeId != uyeId)
                {
                    return NotFound(new { success = false, message = "Rezervasyon bulunamadı." });
                }

                reservation.Durum = "iptal";
                reservation.IptalTarihi = DateTime.UtcNow;
                _context.Rezervasyonlar.Update(reservation);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Rezervasyon iptal edildi." });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Rezervasyon iptali sırasında hata | RezId: {RezId} | UyeId: {UyeId}", id, User?.Identity?.Name);
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("benim-rezervasyonlarim")]
        public async Task<IActionResult> MyReservations([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 50) pageSize = 50;

                var query = _context.Rezervasyonlar
                    .Where(r => r.UyeId == uyeId && r.Durum == "aktif");

                var total = await query.CountAsync();
                var items = await query
                    .OrderBy(r => r.BaslangicTarihi)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var hasMore = page * pageSize < total;

                _logger.LogInformation("Kullanıcı rezervasyonları çekildi | UyeId: {UyeId} | Sayfa: {Page} | Adet: {Count}", uyeId, page, items.Count);

                return Ok(new { success = true, total, page, pageSize, hasMore, data = items });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı rezervasyonları alınırken hata | UyeId: {UyeId}", User?.Identity?.Name);
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }

        // Rezervasyon işlemleri kitap_islemler'e DB trigger'ları ile loglanacaktır.
    }

    public class CreateRezervationRequest
    {
        public int KitapId { get; set; }
        public DateTime BaslangicTarihi { get; set; }
        public DateTime BirisTarihi { get; set; }
    }
}
