using Microsoft.EntityFrameworkCore;
using ktphnAPI.Models;

namespace ktphnAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Kitap> Kitaplar { get; set; }

        public DbSet<Uye> Uyeler { get; set; }

        public DbSet<Rol> Roller { get; set; }

        public DbSet<UyeRol> UyeRolleri { get; set; }

        public DbSet<İslemler> İslemler { get; set; }

        public DbSet<Rezervasyon> Rezervasyonlar { get; set; }
    }
}