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
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Uye>>> GetProfile()
        {
            return await _context.Uyeler.ToListAsync();
        }


        [HttpGet("{id}")]//verdigimiz id deki kisiyi dodnurcke sadece
        public async Task<ActionResult<Uye>> GetUye(int id)
        {
            var uye = await _context.Uyeler.FindAsync(id);

            if (uye == null)
            {
                return NotFound("Uye bulunamadi.");
            }

            return uye;
        }

        [HttpPost]
        public async Task<ActionResult<Uye>> PostUye(Uye uye)
        {
            if (uye.KayitTarihi == null) 
            {
                uye.KayitTarihi = System.DateTime.Now;
            }
            
            _context.Uyeler.Add(uye);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUye", new { id = uye.Id }, uye);
        }
    }
}