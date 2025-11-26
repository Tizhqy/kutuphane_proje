using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ktphnAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KitaplarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KitaplarController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Kitap>>> GetKitaplar()
        {
            return await _context.Kitaplar.ToListAsync();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Kitap>> GetKitap(int id)
        {
            var kitap = await _context.Kitaplar.FindAsync(id);

            if (kitap == null)
            {
                return NotFound();
            }

            return kitap;
        }

        [HttpPost]
        public async Task<ActionResult<Kitap>> PostKitap(Kitap kitap)
        {
            _context.Kitaplar.Add(kitap);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetKitap", new { id = kitap.Id }, kitap);
        }
    }
}