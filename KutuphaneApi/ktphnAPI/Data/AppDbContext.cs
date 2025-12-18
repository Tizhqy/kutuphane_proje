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

        public DbSet<CezaIslemi> CezaIslemleri { get; set; }

        public DbSet<CezaConfig> CezaKonfigurasyonu { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Kitaplar.durum ENUM mapping (musait, odunc, bakim)
            // Ensure the string values match the MySQL ENUM exactly
            modelBuilder.Entity<Kitap>()
                .Property(k => k.Durum)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("musait");
        }
    }
}