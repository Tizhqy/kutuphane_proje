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
    [Authorize(Roles = "admin")]
    public class UyelerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UyelerController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Uye>>> GetUyeler()
        {
            var uyeler = await _context.Uyeler.ToListAsync();
            foreach (var uye in uyeler)
            {
                var roller = await (from ur in _context.UyeRolleri
                                    join r in _context.Roller on ur.RolId equals r.Id
                                    where ur.UyeId == uye.Id
                                    select r.RolAdi).ToListAsync();

                uye.RolIsimleri = string.Join(", ", roller);

                if (string.IsNullOrEmpty(uye.RolIsimleri))
                    uye.RolIsimleri = "Öğrenci";
            }

            return uyeler;
        }
    }
}