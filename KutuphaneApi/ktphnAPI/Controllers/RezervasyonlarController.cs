using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ktphnAPI.Controllers
{
    [Route("api/rezervasyonlar")]
    [ApiController]
    [Authorize]
    public class RezervasyonlarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RezervasyonlarController(AppDbContext context)
        {
            _context = context;
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

                return Ok(new { success = true, total = rezervasyonlar.Count, data = rezervasyonlar });
            }
            catch (System.Exception ex)
            {
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

                if (request.BaslangicTarihi >= request.BirisTarihi)
                {
                    return BadRequest(new { success = false, message = "Bitiş tarihi başlangıç tarihinden sonra olmalıdır." });
                }

                var kitap = await _context.Kitaplar.FindAsync(request.KitapId);
                if (kitap == null)
                {
                    return NotFound(new { success = false, message = "Kitap bulunamadı." });
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

                return Ok(new { success = true, message = "Rezervasyon başarıyla oluşturuldu.", data = reservation });
            }
            catch (System.Exception ex)
            {
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
                return StatusCode(500, new { success = false, message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("benim-rezervasyonlarim")]
        public async Task<IActionResult> MyReservations()
        {
            try
            {
                var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
                {
                    return Unauthorized(new { success = false, message = "Oturum bulunamadı!" });
                }

                var rezervasyonlar = await _context.Rezervasyonlar
                    .Where(r => r.UyeId == uyeId && r.Durum == "aktif")
                    .OrderBy(r => r.BaslangicTarihi)
                    .ToListAsync();

                return Ok(new { success = true, total = rezervasyonlar.Count, data = rezervasyonlar });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Veri alınırken hata oluştu.", detail = ex.Message });
            }
        }
    }

    public class CreateRezervationRequest
    {
        public int KitapId { get; set; }
        public DateTime BaslangicTarihi { get; set; }
        public DateTime BirisTarihi { get; set; }
    }
}
