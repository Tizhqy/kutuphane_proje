using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Linq;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto istek)
        {
            // Validasyon
            if (string.IsNullOrWhiteSpace(istek.Email) || 
                string.IsNullOrWhiteSpace(istek.Sifre) ||
                string.IsNullOrWhiteSpace(istek.Ad) ||
                string.IsNullOrWhiteSpace(istek.Soyad))
            {
                return BadRequest(new { mesaj = "Ad, soyad, email ve şifre zorunludur." });
            }

            // Email zaten var mı?
            var mevcutUye = await _context.Uyeler
                .FirstOrDefaultAsync(u => u.Email == istek.Email);

            if (mevcutUye != null)
            {
                return BadRequest(new { mesaj = "Bu email zaten kayıtlı." });
            }

            // Yeni user oluştur
            var yeniUye = new Uye
            {
                AdSoyad = $"{istek.Ad} {istek.Soyad}",
                Email = istek.Email,
                Sifre = BCrypt.Net.BCrypt.HashPassword(istek.Sifre),  // Hash'le
                Durum = "aktif",
                KayitTarihi = System.DateTime.Now
            };

            _context.Uyeler.Add(yeniUye);
            await _context.SaveChangesAsync();

            // Default role'ü ata (user/ogrenci)
            var userRol = await _context.Roller
                .FirstOrDefaultAsync(r => r.RolAdi == "user" || r.RolAdi == "ogrenci");

            if (userRol != null)
            {
                var uyeRol = new UyeRol
                {
                    UyeId = yeniUye.Id,
                    RolId = userRol.Id
                };
                _context.UyeRolleri.Add(uyeRol);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                mesaj = "Kayıt başarılı. Artık giriş yapabilirsiniz.",
                uyeId = yeniUye.Id,
                email = yeniUye.Email
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto istek)
        {
            var uye = await _context.Uyeler
                .FirstOrDefaultAsync(u => u.Email == istek.Email);

            if (uye == null || !BCrypt.Net.BCrypt.Verify(istek.Sifre, uye.Sifre))
            {
                return Unauthorized(new { mesaj = "E-mail veya şifre hatalı!" });
            }

            var rollerList = await (from ur in _context.UyeRolleri
                                     join r in _context.Roller on ur.RolId equals r.Id
                                     where ur.UyeId == uye.Id
                                     select new { r.RolAdi, r.YetkiSeviyesi }).ToListAsync();

            string kullaniciRolu;
            if (rollerList != null && rollerList.Count > 0)
            {
                var top = rollerList.OrderByDescending(x => x.YetkiSeviyesi).First();
                var raw = (top.RolAdi ?? "ogrenci").ToLower();
                kullaniciRolu = NormalizeRole(raw);
            }
            else
            {
                kullaniciRolu = "ogrenci";
            }

            var token = GenerateJwtToken(uye, kullaniciRolu);

            return Ok(new
            {
                mesaj = "Giriş Başarılı",
                uyeId = uye.Id,
                adSoyad = uye.AdSoyad,
                rol = kullaniciRolu,
                token
            });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto istek)
        {
            var uyeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(uyeIdClaim) || !int.TryParse(uyeIdClaim, out int uyeId))
            {
                return Unauthorized(new { mesaj = "Oturum bulunamadı!" });
            }

            var uye = await _context.Uyeler.FindAsync(uyeId);
            if (uye == null)
            {
                return NotFound(new { mesaj = "Kullanıcı bulunamadı!" });
            }

            if (!BCrypt.Net.BCrypt.Verify(istek.EskiSifre, uye.Sifre))
            {
                return BadRequest(new { mesaj = "Mevcut şifre yanlış!" });
            }

            if (istek.YeniSifre.Length < 6)
            {
                return BadRequest(new { mesaj = "Yeni şifre en az 6 karakter olmalıdır!" });
            }

            uye.Sifre = BCrypt.Net.BCrypt.HashPassword(istek.YeniSifre);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Şifre başarıyla değiştirildi!" });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { mesaj = "Çıkış yapıldı!" });
        }

        private static string NormalizeRole(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "ogrenci";
            var r = raw.ToLower().Trim();
            
            if (r.Contains("admin") || r.Contains("super") || r.Contains("süper") || r == "super_admin" || r.Contains("yonetici") || r.Contains("yönetici"))
                return "admin";
            
            if (r.Contains("akademisyen") || r == "academic" || r == "akademik")
                return "akademisyen";
            
            if (r.Contains("personel") || r == "staff" || r == "calisan" || r == "çalışan")
                return "personel";
            
            return "ogrenci";
        }

        private string GenerateJwtToken(Uye uye, string rol)
        {
            var jwtSection = _config.GetSection("Jwt");
            var key = jwtSection.GetValue<string>("Key") ?? string.Empty;
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expireMinutes = jwtSection.GetValue<int?>("ExpiresMinutes") ?? 60;

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, uye.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, uye.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, uye.AdSoyad ?? string.Empty),
                new Claim(ClaimTypes.Role, rol ?? "ogrenci")
            };

            var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer,
                audience,
                claims,
                expires: System.DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}