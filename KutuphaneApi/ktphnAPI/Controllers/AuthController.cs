using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto istek)
        {
            var uye = await _context.Uyeler
                .FirstOrDefaultAsync(u => u.Email == istek.Email && u.Sifre == istek.Sifre);

            if (uye == null)
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
                kullaniciRolu = (top.RolAdi ?? "ogrenci").ToLower();
            }
            else
            {
                kullaniciRolu = "ogrenci";
            }

            return Ok(new
            {
                mesaj = "Giriş Başarılı",
                uyeId = uye.Id,
                adSoyad = uye.AdSoyad,
                rol = kullaniciRolu,
            });
        }
    }
}