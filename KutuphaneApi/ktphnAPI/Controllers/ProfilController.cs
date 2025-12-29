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
    [Authorize]
    public class ProfilController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfilController(AppDbContext context)
        {
            _context = context;
        }
        // Sadece oturumdaki kullanıcının profilini döndür (şifresiz DTO)
        [HttpGet]
        public async Task<ActionResult<UyeProfileDto>> GetProfile()
        {
            var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
            {
                return Unauthorized();
            }

            var uye = await _context.Uyeler.FindAsync(uyeId);
            if (uye == null)
            {
                return NotFound("Uye bulunamadi.");
            }

            var roller = await (from ur in _context.UyeRolleri
                                join r in _context.Roller on ur.RolId equals r.Id
                                where ur.UyeId == uye.Id
                                select r.RolAdi).ToListAsync();

            var dto = new UyeProfileDto
            {
                Id = uye.Id,
                AdSoyad = uye.AdSoyad,
                Email = uye.Email,
                Telefon = uye.Telefon,
                OgrenciNo = uye.OgrenciNo,
                Durum = uye.Durum,
                KayitTarihi = uye.KayitTarihi,
                RolIsimleri = string.Join(", ", roller)
            };

            return Ok(dto);
        }


        [HttpGet("{id}")]//verdigimiz id deki kisiyi dodnurcke sadece
        public async Task<ActionResult<UyeProfileDto>> GetUye(int id)
        {
            var uye = await _context.Uyeler.FindAsync(id);
            if (uye == null)
            {
                return NotFound("Uye bulunamadi.");
            }

            // Sadece admin ya da kendi profili erişebilsin
            var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
            var isAdmin = role.Contains("admin");
            if (!isAdmin && (!int.TryParse(uyeIdClaim, out int authId) || authId != id))
            {
                return Forbid();
            }

            var roller = await (from ur in _context.UyeRolleri
                                join r in _context.Roller on ur.RolId equals r.Id
                                where ur.UyeId == uye.Id
                                select r.RolAdi).ToListAsync();

            var dto = new UyeProfileDto
            {
                Id = uye.Id,
                AdSoyad = uye.AdSoyad,
                Email = uye.Email,
                Telefon = uye.Telefon,
                OgrenciNo = uye.OgrenciNo,
                Durum = uye.Durum,
                KayitTarihi = uye.KayitTarihi,
                RolIsimleri = string.Join(", ", roller)
            };

            return Ok(dto);
        }

        // Yeni kullanıcı oluşturmayı sadece admin'e aç; şifreyi hash'le
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<UyeProfileDto>> PostUye(Uye uye)
        {
            if (string.IsNullOrWhiteSpace(uye.Sifre))
            {
                return BadRequest("Şifre zorunludur.");
            }

            if (uye.KayitTarihi == null)
            {
                uye.KayitTarihi = System.DateTime.Now;
            }

            // Boş string'leri null'a çevir (unique constraint için)
            if (string.IsNullOrWhiteSpace(uye.OgrenciNo))
            {
                uye.OgrenciNo = null;
            }
            if (string.IsNullOrWhiteSpace(uye.Telefon))
            {
                uye.Telefon = null;
            }

            // Hash password
            uye.Sifre = BCrypt.Net.BCrypt.HashPassword(uye.Sifre);

            _context.Uyeler.Add(uye);
            await _context.SaveChangesAsync();

            var dto = new UyeProfileDto
            {
                Id = uye.Id,
                AdSoyad = uye.AdSoyad,
                Email = uye.Email,
                Telefon = uye.Telefon,
                OgrenciNo = uye.OgrenciNo,
                Durum = uye.Durum,
                KayitTarihi = uye.KayitTarihi,
                RolIsimleri = string.Empty
            };

            return CreatedAtAction("GetUye", new { id = uye.Id }, dto);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UyeUpdateDto dto)
        {
            var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
            {
                return Unauthorized();
            }

            var uye = await _context.Uyeler.FindAsync(uyeId);
            if (uye == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Model validasyonu
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Ad Soyad güncelle
            if (!string.IsNullOrWhiteSpace(dto.AdSoyad))
            {
                uye.AdSoyad = dto.AdSoyad.Trim();
            }

            // Email güncelle
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                uye.Email = dto.Email.ToLower().Trim();
            }

            // Telefon güncelle
            if (!string.IsNullOrWhiteSpace(dto.Telefon))
            {
                uye.Telefon = dto.Telefon.Trim();
            }
            else
            {
                uye.Telefon = null;
            }

            // Öğrenci No güncelle
            if (!string.IsNullOrWhiteSpace(dto.OgrenciNo))
            {
                uye.OgrenciNo = dto.OgrenciNo.Trim();
            }
            else
            {
                uye.OgrenciNo = null;
            }

            _context.Uyeler.Update(uye);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Profil başarıyla güncellendi." });
        }
    }
}