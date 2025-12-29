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
using Microsoft.AspNetCore.RateLimiting;
using ktphnAPI.Services;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IConfiguration config, IEmailService emailService, ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        [EnableRateLimiting("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto istek)
        {
            // Model validasyonu
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                            .Where(x => x.Value?.Errors.Count > 0)
                            .SelectMany(x => x.Value!.Errors)
                            .Select(x => x.ErrorMessage)
                            .ToList();
                return BadRequest(new { mesaj = "Validasyon hatası", hatalar = errors });
            }

            // Email format kontrolü (ekstra güvenlik için)
            if (!System.Text.RegularExpressions.Regex.IsMatch(istek.Email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return BadRequest(new { mesaj = "Geçerli bir email adresi giriniz." });
            }

            // Şifre güçlülük kontrolü (ekstra güvenlik için)
            if (!System.Text.RegularExpressions.Regex.IsMatch(istek.Sifre,
                @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
            {
                return BadRequest(new
                {
                    mesaj = "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir."
                });
            }

            // Email zaten var mı?
            var mevcutUye = await _context.Uyeler
                .FirstOrDefaultAsync(u => u.Email == istek.Email.ToLower().Trim());

            if (mevcutUye != null)
            {
                return BadRequest(new { mesaj = "Bu email zaten kayıtlı." });
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1. Yeni user nesnesini hazırla
                    var yeniUye = new Uye
                    {
                        AdSoyad = $"{istek.Ad.Trim()} {istek.Soyad.Trim()}",
                        Email = istek.Email.ToLower().Trim(),
                        Sifre = BCrypt.Net.BCrypt.HashPassword(istek.Sifre),
                        Durum = "aktif",
                        KayitTarihi = System.DateTime.UtcNow,
                        OgrenciNo = null,
                        Telefon = null
                    };

                    // 2. ÖNCE ÜYEYİ EKLE VE KAYDET (Hatanın Çözümü Burada)
                    _context.Uyeler.Add(yeniUye);
                    await _context.SaveChangesAsync(); // Bu satır çalışınca yeniUye.Id oluşur (örn: 5)

                    // 3. Sonra Rolü Ata
                    var userRol = await _context.Roller
                        .FirstOrDefaultAsync(r => r.RolAdi == "user" || r.RolAdi == "ogrenci");

                    if (userRol != null)
                    {
                        var uyeRol = new UyeRol
                        {
                            UyeId = yeniUye.Id, // Artık ID var, hata vermez
                            RolId = userRol.Id
                        };
                        _context.UyeRolleri.Add(uyeRol);
                        await _context.SaveChangesAsync();
                    }

                    // 4. Her şey hatasızsa işlemi onayla (Commit)
                    await transaction.CommitAsync();

                    // ---------------------------------------------------------
                    // TRANSACTION BİTİŞİ - Veritabanı işi bitti, şimdi mail atabiliriz
                    // ---------------------------------------------------------

                    // Mail Gönderme (Transaction dışına aldık, mail patlarsa üye silinmesin diye)
                    try
                    {
                        await _emailService.SendEmailAsync(
                            yeniUye.Email,
                            "Kayıt Başarılı ✔️",
                            $@"<html>
                        <body style='font-family: Arial;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                                <h2>Hoş geldiniz, {yeniUye.AdSoyad} 👋</h2>
                                <p>Kütüphane sistemimize başarıyla kayıt oldunuz.</p>
                                <p>Artık giriş yaparak kitapları görüntüleyebilir, ödünç alabilir ve hesabınızı yönetebilirsiniz.</p>
                                <br/>
                                <p style='color: #777; font-size: 12px;'>Bu e-posta otomatik gönderilmiştir.</p>
                            </div>
                        </body>
                    </html>",
                            isHtml: true
                        );
                        _logger.LogInformation("Kayıt maili gönderildi: {email}", yeniUye.Email);
                    }
                    catch (Exception ex)
                    {
                        // Mail gitmese bile kayıt başarılı olsun, logla geç
                        _logger.LogError(ex, "Kayıt maili gönderilemedi: {email}", yeniUye.Email);
                    }

                    return Ok(new
                    {
                        mesaj = "Kayıt başarılı. Artık giriş yapabilirsiniz.",
                        uyeId = yeniUye.Id,
                        email = yeniUye.Email
                    });
                }
                catch (Exception ex)
                {
                    // Hata olursa (örn: Rol eklerken) üyeyi de geri al (Rollback)
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Kayıt sırasında transaction hatası");
                    return StatusCode(500, new { mesaj = "Kayıt işlemi sırasında bir hata oluştu.", detay = ex.Message });
                }
                }
            }

            [HttpPost("login")]
            [EnableRateLimiting("login")]
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
            [Authorize]
            public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto istek)
            {
                // Model validasyonu
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToList();
                    return BadRequest(new { mesaj = "Validasyon hatası", hatalar = errors });
                }

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

                // Şifre güçlülük kontrolü (ekstra güvenlik için)
                if (!System.Text.RegularExpressions.Regex.IsMatch(istek.YeniSifre,
                    @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
                {
                    return BadRequest(new
                    {
                        mesaj = "Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir!"
                    });
                }

                uye.Sifre = BCrypt.Net.BCrypt.HashPassword(istek.YeniSifre);
                await _context.SaveChangesAsync();

                return Ok(new { mesaj = "Şifre başarıyla değiştirildi!" });
            }

            [HttpPost("forgot-password")]
            public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto istek)
            {
                if (string.IsNullOrWhiteSpace(istek.Email))
                {
                    return BadRequest(new { success = false, mesaj = "Email adresi gereklidir" });
                }

                var uye = await _context.Uyeler.FirstOrDefaultAsync(u => u.Email == istek.Email);

                // Güvenlik: Hesap olup olmadığını söyleme (timing attack prevention için her durumda aynı süre)
                await Task.Delay(500);

                if (uye == null)
                {
                    // Hesap yoksa da mail gönder (kullanıcıya hesap olmadığını bildirmek için)
                    try
                    {
                        await _emailService.SendEmailAsync(
                            istek.Email,
                            "Şifre Sıfırlama Talebi",
                            $@"<html><body style='font-family: Arial;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                                <h2 style='color: #d32f2f;'>⚠️ Hesap Bulunamadı</h2>
                                <p>Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.</p>
                                <p>Eğer hesabınız yoksa, lütfen kayıt olun.</p>
                                <p style='color: #666; font-size: 12px; margin-top: 20px;'>Bu bir otomatik mail'dir.</p>
                            </div>
                        </body></html>",
                            isHtml: true
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Hesap bulunamadı maili gönderilemedi: {email}", istek.Email);
                    }

                    return Ok(new { success = true, mesaj = "Eğer hesabınız varsa, e-posta adresinize şifre sıfırlama talimatları gönderildi." });
                }

                // Geçici şifre oluştur (8 karakter, karışık)
                var yeniSifre = GenerateRandomPassword(8);
                uye.Sifre = BCrypt.Net.BCrypt.HashPassword(yeniSifre);
                await _context.SaveChangesAsync();

                // Mail gönder
                try
                {
                    await _emailService.SendPasswordResetAsync(uye.Email, uye.AdSoyad, yeniSifre);
                    _logger.LogInformation("Şifre sıfırlama maili gönderildi: {email}", uye.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Şifre sıfırlama maili gönderilemedi: {email}", uye.Email);
                    return StatusCode(500, new { success = false, mesaj = "Mail gönderilirken hata oluştu" });
                }

                return Ok(new { success = true, mesaj = "Eğer hesabınız varsa, e-posta adresinize şifre sıfırlama talimatları gönderildi." });
            }

        private string GenerateRandomPassword(int length)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
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